const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  stepIndex: { type: Number, required: true },
  approverRole: {
    type: String,
    required: true,
    enum: ["manager", "finance", "director", "admin", "employee"],
  },
});

const workflowSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true },
    // Ordered steps representing sequential approvers after (optional) manager pre-step
    steps: { type: [stepSchema], default: [] },
    // Conditional rules definition (optional augment to sequential flow)
    rules: {
      type: {
        type: String,
        enum: ["percentage", "specificApprover", "hybrid", "none"],
        default: "none",
      },
      percentage: { type: Number, default: 60 },
      specialRole: { type: String }, // e.g., 'director' or 'finance'
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workflow", workflowSchema);
