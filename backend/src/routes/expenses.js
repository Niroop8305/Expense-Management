const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const User = require("../models/User");
const Workflow = require("../models/Workflow");
const AuditLog = require("../models/AuditLog");
const { authenticate, isManagerOrAdmin, isApprover } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { evaluateRules, progressExpense, getCurrentRequiredRole } = require("../utils/approvalEngine");

// POST /api/expenses/submit - Submit a new expense (with optional receipt)
router.post("/submit", authenticate, upload.single("receipt"), async (req, res) => {
  try {
    // Policy: only 'employee' role can submit expenses (use claimRole fallback)
    const claimRole = req.user.role || req.user.roleName;
    if (claimRole !== 'employee') {
      return res.status(403).json({ message: 'Only employees can submit expenses' });
    }
    const { amount, currency, category, description, date, workflowId, isManagerApprover } = req.body;
    if (!amount || !category || !description || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    let workflow = null;
    if (workflowId) {
      workflow = await Workflow.findOne({ _id: workflowId, company: req.user.companyId });
      if (!workflow) return res.status(400).json({ message: "Invalid workflow for this company" });
    }

    const expense = new Expense({
      amount,
      currency: currency || "USD",
      category,
      description,
      date: new Date(date),
      submittedBy: req.user.userId,
      company: req.user.companyId,
      status: "pending",
      receiptUrl: req.file ? `/uploads/receipts/${req.file.filename}` : null,
      workflow: workflow ? workflow._id : null,
      isManagerApprover: isManagerApprover !== undefined ? isManagerApprover : true,
    });
    await expense.save();
    await expense.populate("submittedBy", "name email role");
    return res.status(201).json({ message: "Expense submitted successfully", expense });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/expenses - Get expenses based on user role
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = { company: req.user.companyId };

    // Filter by status if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    let expenses;

    if (req.user.role === "admin") {
      // Admin sees all company expenses
      expenses = await Expense.find(query)
        .populate("submittedBy", "name email role")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });
    } else if (req.user.role === "manager") {
      // Manager sees their team's expenses (employees they manage)
      const teamMembers = await User.find({
        company: req.user.companyId,
        manager: req.user.userId,
      }).select("_id");

      const teamMemberIds = teamMembers.map((member) => member._id);
      teamMemberIds.push(req.user.userId); // Include manager's own expenses

      query.submittedBy = { $in: teamMemberIds };

      expenses = await Expense.find(query)
        .populate("submittedBy", "name email role")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });
    } else {
      // Employee sees only their own expenses
      query.submittedBy = req.user.userId;

      expenses = await Expense.find(query)
        .populate("submittedBy", "name email role")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({ expenses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/expenses/pending - Get pending expenses for approval (Manager/Admin only)
router.get("/pending", authenticate, isApprover, async (req, res) => {
  try {
    const claimRole = req.user.role || req.user.roleName; // tolerate legacy tokens
    let query = { company: req.user.companyId, status: "pending" };
    const raw = await Expense.find(query)
      .populate("workflow")
      .populate("submittedBy", "name email manager role");

    const list = [];
    for (const exp of raw) {
      const requiredRole = getCurrentRequiredRole(exp);
      if (!requiredRole) continue;

      // User-based (member) step handling
      if (requiredRole === 'users') {
        if (!exp.workflow || exp.currentStep >= exp.workflow.steps.length) continue;
        const step = exp.workflow.steps[exp.currentStep];
        if (step.approverType === 'users') {
          const allowedUsers = (step.approverUsers || []).map(id => id.toString());
          const hasApproved = (exp.approvals || []).some(a => a.approver?.toString() === req.user.userId);
            // Determine if step already satisfied (so we shouldn't show it again)
          let stepSatisfied = false;
          if (step.approvalMode === 'all') {
            const approvedCount = (exp.approvals || []).filter(a => allowedUsers.includes(a.approver?.toString()) && a.decision === 'approved').length;
            stepSatisfied = approvedCount === allowedUsers.length;
          } else { // any
            stepSatisfied = (exp.approvals || []).some(a => allowedUsers.includes(a.approver?.toString()) && a.decision === 'approved');
          }
           if (allowedUsers.includes(req.user.userId) && !hasApproved && !stepSatisfied) {
             exp._doc._requiredRole = 'members';
             list.push(exp);
            continue; // already added; don't double-process
          }
        }
      }

      // Role-based handling (manager + dynamic roles)
       if (requiredRole === claimRole) {
         // Manager now has global visibility of manager-step expenses
         exp._doc._requiredRole = requiredRole;
         list.push(exp);
      }
    }
    return res.status(200).json({ expenses: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/expenses/:id - Get single expense details
router.get("/:id", authenticate, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.companyId,
    })
      .populate("submittedBy", "name email role")
      .populate("reviewedBy", "name email")
      .populate("workflow");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if user has permission to view this expense
    if (
      req.user.role === "employee" &&
      expense.submittedBy._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ expense });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/expenses/:id/approve - Approve an expense (Manager/Admin only)
// PUT /api/expenses/:id/approve - Approve an expense (Approver roles)
router.put("/:id/approve", authenticate, isApprover, async (req, res) => {
  try {
    console.log('[APPROVE] Attempt by user', req.user.userId, 'role', req.user.role || req.user.roleName, 'expense', req.params.id);
    const expense = await Expense.findOne({ _id: req.params.id, company: req.user.companyId })
      .populate("workflow")
      .populate("submittedBy", "name email manager");
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    if (expense.status !== "pending") return res.status(400).json({ message: "Expense already reviewed" });

  const claimRole = req.user.role || req.user.roleName;
  const requiredRole = getCurrentRequiredRole(expense);
    if (!requiredRole) {
      return res.status(400).json({ message: "No approval is required at this stage" });
    }

    // User-based step (custom member approvers)
    let isUserStep = false;
    if (requiredRole === 'users') {
      isUserStep = true;
      const step = expense.workflow.steps[expense.currentStep];
      const allowedUsers = (step.approverUsers || []).map(id => id.toString());
      if (!allowedUsers.includes(req.user.userId)) {
        return res.status(403).json({ message: "You are not an assigned approver for this step" });
      }
      // prevent extra approvals when step already satisfied
      if (step.approvalMode === 'all') {
        const approvedCount = (expense.approvals || []).filter(a => allowedUsers.includes(a.approver?.toString()) && a.decision === 'approved').length;
        if (approvedCount === allowedUsers.length) return res.status(400).json({ message: 'Step already satisfied' });
      } else {
        const anyApproved = (expense.approvals || []).some(a => allowedUsers.includes(a.approver?.toString()) && a.decision === 'approved');
        if (anyApproved) return res.status(400).json({ message: 'Step already satisfied by another approver' });
      }
    } else if (requiredRole !== claimRole) {
      return res.status(403).json({ message: `This step requires role '${requiredRole}'` });
    }
    // Manager global approval enabled: removed team-only restriction

    // prevent duplicate approvals by same role (or same user) at same step
    const already = expense.approvals.find((a) => a.approver.toString() === req.user.userId);
    if (already) return res.status(400).json({ message: "You have already acted on this expense" });

    expense.approvals.push({
      approver: req.user.userId,
      role: isUserStep ? 'users' : claimRole,
      decision: "approved",
      comment: req.body.comment || "",
      actedAt: new Date(),
    });

    await AuditLog.create({ expense: expense._id, action: "approve", user: req.user.userId, comment: req.body.comment || "" });

    // Advance sequential pointer if this was a workflow step (not the manager pre-step)
    if (expense.workflow && requiredRole !== "manager") {
      if (!isUserStep) {
        if (expense.currentStep < expense.workflow.steps.length) {
          const step = expense.workflow.steps[expense.currentStep];
            if (step.approverType === 'role' && step.approverRole === requiredRole) {
              expense.currentStep += 1;
            }
        }
      }
    }

    await expense.save();
    const updated = await progressExpense(expense._id);
    console.log('[APPROVE] Post-progress status', updated.status, 'currentStep', updated.currentStep);
    await updated.populate("submittedBy", "name email role");
    return res.status(200).json({ message: "Expense approval recorded", expense: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/expenses/:id/reject - Reject an expense (Approver roles)
router.put("/:id/reject", authenticate, isApprover, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.companyId,
    }).populate("submittedBy", "name email manager");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({ message: "Expense already reviewed" });
    }

    // Manager can only reject their team member's expenses
    // Manager restriction
    const claimRole = req.user.role || req.user.roleName;
    // Manager global rejection enabled: removed team-only restriction

    // If it's a user-based step ensure this user is among assigned users and hasn't already approved/rejected
    const requiredRole = getCurrentRequiredRole(expense);
    if (requiredRole === 'users') {
      if (!expense.workflow || expense.currentStep >= expense.workflow.steps.length) {
        return res.status(400).json({ message: 'Invalid workflow step' });
      }
      const step = expense.workflow.steps[expense.currentStep];
      if (step.approverType === 'users') {
        const allowedUsers = (step.approverUsers || []).map(id => id.toString());
        if (!allowedUsers.includes(req.user.userId)) {
          return res.status(403).json({ message: 'You are not an assigned approver for this step' });
        }
        const alreadyActed = (expense.approvals || []).some(a => a.approver?.toString() === req.user.userId);
        if (alreadyActed) return res.status(400).json({ message: 'You have already acted on this expense' });
      }
    }

    // Record rejection and close the flow
    expense.approvals.push({
      approver: req.user.userId,
      role: requiredRole === 'users' ? 'users' : claimRole,
      decision: "rejected",
      comment: reason,
      actedAt: new Date(),
    });

    expense.status = "rejected";
    expense.rejectionReason = reason;

    await AuditLog.create({
      expense: expense._id,
      action: "reject",
      user: req.user.userId,
      comment: reason,
    });

    await expense.save();

    return res.status(200).json({ message: "Expense rejected", expense });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/expenses/stats/summary - Get expense statistics (Admin/Manager)
router.get(
  "/stats/summary",
  authenticate,
  isManagerOrAdmin,
  async (req, res) => {
    try {
      let query = { company: req.user.companyId };

      if (req.user.role === "manager") {
        const teamMembers = await User.find({
          company: req.user.companyId,
          manager: req.user.userId,
        }).select("_id");

        const teamMemberIds = teamMembers.map((member) => member._id);
        teamMemberIds.push(req.user.userId);
        query.submittedBy = { $in: teamMemberIds };
      }

      const totalPending = await Expense.countDocuments({
        ...query,
        status: "pending",
      });
      const totalApproved = await Expense.countDocuments({
        ...query,
        status: "approved",
      });
      const totalRejected = await Expense.countDocuments({
        ...query,
        status: "rejected",
      });

      const approvedExpenses = await Expense.find({
        ...query,
        status: "approved",
      });
      const totalApprovedAmount = approvedExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      return res.status(200).json({
        stats: {
          totalPending,
          totalApproved,
          totalRejected,
          totalApprovedAmount,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/expenses/export/csv - Export expenses to CSV
router.get("/export/csv", authenticate, async (req, res) => {
  try {
    let query = { company: req.user.companyId };
    let expenses;

    // Role-based filtering
    if (req.user.role === "admin") {
      expenses = await Expense.find(query)
        .populate("submittedBy", "name email")
        .populate("reviewedBy", "name email")
        .sort({ date: -1 });
    } else if (req.user.role === "manager") {
      const teamMembers = await User.find({
        company: req.user.companyId,
        manager: req.user.userId,
      }).select("_id");

      const teamMemberIds = teamMembers.map((member) => member._id);
      teamMemberIds.push(req.user.userId);
      query.submittedBy = { $in: teamMemberIds };

      expenses = await Expense.find(query)
        .populate("submittedBy", "name email")
        .populate("reviewedBy", "name email")
        .sort({ date: -1 });
    } else {
      query.submittedBy = req.user.userId;
      expenses = await Expense.find(query)
        .populate("submittedBy", "name email")
        .populate("reviewedBy", "name email")
        .sort({ date: -1 });
    }

    // Generate CSV content
    const csvHeader =
      "Date,Employee,Email,Category,Description,Amount,Currency,Status,Reviewed By,Reviewed At,Rejection Reason\n";

    const csvRows = expenses.map((exp) => {
      const date = new Date(exp.date).toISOString().split("T")[0];
      const reviewedAt = exp.reviewedAt
        ? new Date(exp.reviewedAt).toISOString().split("T")[0]
        : "-";
      const reviewedBy = exp.reviewedBy?.name || "-";
      const rejectionReason = exp.rejectionReason?.replace(/,/g, ";") || "-";
      const description = exp.description.replace(/,/g, ";");

      return `${date},"${exp.submittedBy.name}","${exp.submittedBy.email}","${exp.category}","${description}",${exp.amount},${exp.currency},${exp.status},"${reviewedBy}",${reviewedAt},"${rejectionReason}"`;
    });

    const csv = csvHeader + csvRows.join("\n");

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=expenses-${Date.now()}.csv`
    );

    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// ========== Timeline / Audit endpoint (placed after export to keep existing exports working) ==========
// GET /api/expenses/:id/timeline - returns expense + approvals + workflow steps + audit logs
router.get("/:id/timeline", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ _id: id, company: req.user.companyId })
      .populate("submittedBy", "name email role manager")
      .populate({ path: "approvals.approver", select: "name email role" })
      .populate("workflow");
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const AuditLog = require("../models/AuditLog");
    const auditLogs = await AuditLog.find({ expense: id })
      .populate("user", "name email role")
      .sort({ timestamp: 1 });

    // Build step visualization data
    const steps = [];
    if (expense.isManagerApprover) {
      const managerApproval = (expense.approvals || []).find(a => a.role === "manager");
      steps.push({
        label: "Manager",
        role: "manager",
        stepIndex: -1,
        status: managerApproval ? managerApproval.decision : (expense.status === "rejected" ? "skipped" : "pending"),
        actedAt: managerApproval?.actedAt || null,
        approver: managerApproval?.approver || null,
        comment: managerApproval?.comment || null,
      });
    }
    if (expense.workflow && expense.workflow.steps) {
      const ordered = [...expense.workflow.steps].sort((a,b)=>a.stepIndex-b.stepIndex);
      for (const s of ordered) {
        if (s.approverType === 'users') {
          // Collect individual approvals among members
            const memberApprovals = (expense.approvals || []).filter(a => a.role === 'users');
            const approvedIds = memberApprovals.map(a => a.approver?.toString());
            const totalMembers = (s.approverUsers || []).length;
            let status = 'pending';
            if (expense.status === 'rejected') status = 'skipped';
            if (s.approvalMode === 'all' && totalMembers > 0 && approvedIds.length === totalMembers) status = 'approved';
            if (s.approvalMode === 'any' && approvedIds.length > 0) status = 'approved';
            steps.push({
              label: `Members (${totalMembers})`,
              role: 'users',
              stepIndex: s.stepIndex,
              status,
              actedAt: null,
              approver: null,
              comment: null,
              approvals: memberApprovals.map(a => ({ approver: a.approver, actedAt: a.actedAt, decision: a.decision }))
            });
        } else {
          const approval = (expense.approvals || []).find(a => a.role === s.approverRole);
          steps.push({
            label: s.approverRole.charAt(0).toUpperCase()+s.approverRole.slice(1),
            role: s.approverRole,
            stepIndex: s.stepIndex,
            status: approval ? approval.decision : (expense.status === "rejected" ? "skipped" : "pending"),
            actedAt: approval?.actedAt || null,
            approver: approval?.approver || null,
            comment: approval?.comment || null,
          });
        }
      }
    }

    return res.json({
      expense,
      steps,
      approvals: expense.approvals || [],
      auditLogs,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
