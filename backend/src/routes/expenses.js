const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const User = require("../models/User");
const { authenticate, isManagerOrAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// POST /api/expenses/submit - Submit a new expense (with optional receipt)
router.post(
  "/submit",
  authenticate,
  upload.single("receipt"),
  async (req, res) => {
    try {
      const { amount, currency, category, description, date } = req.body;

      // Validate required fields
      if (!amount || !category || !description || !date) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate amount is positive
      if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be positive" });
      }

      // Create new expense
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
      });

      await expense.save();

      // Populate submittedBy details
      await expense.populate("submittedBy", "name email");

      return res.status(201).json({
        message: "Expense submitted successfully",
        expense,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

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
router.get("/pending", authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    let query = { company: req.user.companyId, status: "pending" };

    if (req.user.role === "manager") {
      // Manager sees pending expenses from their team
      const teamMembers = await User.find({
        company: req.user.companyId,
        manager: req.user.userId,
      }).select("_id");

      const teamMemberIds = teamMembers.map((member) => member._id);
      query.submittedBy = { $in: teamMemberIds };
    }
    // Admin sees all pending expenses (no additional filter needed)

    const expenses = await Expense.find(query)
      .populate("submittedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ expenses });
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
      .populate("reviewedBy", "name email");

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
router.put("/:id/approve", authenticate, isManagerOrAdmin, async (req, res) => {
  try {
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

    // Manager can only approve their team member's expenses
    if (req.user.role === "manager") {
      if (
        expense.submittedBy.manager?.toString() !== req.user.userId &&
        expense.submittedBy._id.toString() !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ message: "You can only approve your team's expenses" });
      }
    }

    expense.status = "approved";
    expense.reviewedBy = req.user.userId;
    expense.reviewedAt = new Date();

    await expense.save();
    await expense.populate("reviewedBy", "name email");

    return res.status(200).json({
      message: "Expense approved successfully",
      expense,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/expenses/:id/reject - Reject an expense (Manager/Admin only)
router.put("/:id/reject", authenticate, isManagerOrAdmin, async (req, res) => {
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
    if (req.user.role === "manager") {
      if (
        expense.submittedBy.manager?.toString() !== req.user.userId &&
        expense.submittedBy._id.toString() !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ message: "You can only reject your team's expenses" });
      }
    }

    expense.status = "rejected";
    expense.reviewedBy = req.user.userId;
    expense.reviewedAt = new Date();
    expense.rejectionReason = reason;

    await expense.save();
    await expense.populate("reviewedBy", "name email");

    return res.status(200).json({
      message: "Expense rejected successfully",
      expense,
    });
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
