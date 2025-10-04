const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  expense: { type: mongoose.Schema.Types.ObjectId, ref: "Expense", required: true },
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditSchema);
