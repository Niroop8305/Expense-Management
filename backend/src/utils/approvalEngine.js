const Workflow = require("../models/Workflow");
const Expense = require("../models/Expense");

/**
 * Utility: has manager already approved?
 */
function managerApproved(expense) {
  return (expense.approvals || []).some((a) => a.role === "manager" && a.decision === "approved");
}

/**
 * Get the role that is currently expected to act on the expense.
 * Returns null if no further action required (already approved) or no workflow.
 */
function getCurrentRequiredRole(expense) {
  if (expense.status !== "pending") return null;
  // Manager pre-step
  if (expense.isManagerApprover && !managerApproved(expense)) return "manager";
  if (!expense.workflow) return null; // no configured workflow
  const wf = expense.workflow.steps ? expense.workflow : null;
  if (!wf) return null;
  if (expense.currentStep >= wf.steps.length) return null; // done
  return wf.steps[expense.currentStep].approverRole;
}

/**
 * Evaluate conditional rules for an expense and its workflow
 * Returns: { approved: boolean, reason: string }
 */
async function evaluateRules(expense) {
  if (!expense.workflow) return { approved: false };

  // workflow may be populated already; if not, fetch
  let workflow = expense.workflow.steps ? expense.workflow : await Workflow.findById(expense.workflow);
  if (!workflow) return { approved: false };

  const rules = workflow.rules || { type: "none" };
  const approvals = expense.approvals || [];
  const totalApprovers = workflow.steps.length + (expense.isManagerApprover ? 1 : 0);
  const approvedCount = approvals.filter((a) => a.decision === "approved").length;

  if (rules.type === "specificApprover" && rules.specialRole) {
    const hasSpecial = approvals.some(
      (a) => a.role === rules.specialRole && a.decision === "approved"
    );
    if (hasSpecial) return { approved: true, reason: `special_${rules.specialRole}` };
  }

  if (rules.type === "percentage" || rules.type === "hybrid") {
    const pct = (approvedCount / Math.max(1, totalApprovers)) * 100;
    if (pct >= (rules.percentage || 60)) {
      return { approved: true, reason: `percentage_${rules.percentage || 60}` };
    }
  }

  if (rules.type === "hybrid" && rules.specialRole) {
    const hasSpecial = approvals.some(
      (a) => a.role === rules.specialRole && a.decision === "approved"
    );
    if (hasSpecial) return { approved: true, reason: `special_${rules.specialRole}` };
  }

  return { approved: false };
}

/**
 * After recording an approval, advance sequential step pointer or finish.
 * This does NOT add approval records; caller must have pushed approval already.
 */
async function progressExpense(expenseId) {
  const expense = await Expense.findById(expenseId).populate("workflow");
  if (!expense) throw new Error("Expense not found");
  if (expense.status !== "pending") return expense;

  // If manager pre-step required but not yet approved -> wait
  if (expense.isManagerApprover && !managerApproved(expense)) {
    return expense; // waiting for manager
  }

  // If no workflow configured then after manager (if any) approval we can finalize
  if (!expense.workflow) {
    expense.status = "approved";
    await expense.save();
    return expense;
  }

  // If workflow defined, ensure currentStep pointer is within bounds
  if (expense.workflow && expense.workflow.steps) {
    // If a step's role has just approved, and all approvals contain that role exactly once, advance
    const currentRole = getCurrentRequiredRole(expense); // role required BEFORE potential advance
    if (currentRole) {
      // still waiting on that role; nothing to do
    } else {
      // No current required role -> maybe completed all steps
    }
    // If manager has approved and we haven't started steps yet (currentStep === 0)
    // we only advance when a step approver approves; handled in route logic.
  }

  // Evaluate conditional rules (percentage / special approver) possibly after each approval
  const evalRes = await evaluateRules(expense);
  if (evalRes.approved) {
    expense.status = "approved";
    await expense.save();
    return expense;
  }

  // If all sequential steps completed -> approve
  if (expense.workflow && expense.workflow.steps && expense.currentStep >= expense.workflow.steps.length) {
    expense.status = "approved";
    await expense.save();
    return expense;
  }

  await expense.save();
  return expense;
}

module.exports = { evaluateRules, progressExpense, getCurrentRequiredRole, managerApproved };
