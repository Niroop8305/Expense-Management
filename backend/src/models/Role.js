const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true }, // stored lowercase
  displayName: { type: String },
  isApprover: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false }, // admin / employee
  createdAt: { type: Date, default: Date.now }
});

roleSchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);