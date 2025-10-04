const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    // support additional roles used in approval workflows
    enum: ["admin", "manager", "employee", "finance", "director"],
    default: "employee",
  },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
