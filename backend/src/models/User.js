const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // legacy role field kept for backward compatibility; for dynamic roles prefer roleName
  role: { type: String, default: "employee" },
  roleName: { type: String, default: "employee" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
