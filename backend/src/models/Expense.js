const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // Original amount and currency as entered by employee
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    // Converted amount in company's base currency
    convertedAmount: {
      type: Number,
      required: true,
    },
    convertedCurrency: {
      type: String,
      required: true,
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    conversionDate: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Travel",
        "Food",
        "Accommodation",
        "Transportation",
        "Office Supplies",
        "Equipment",
        "Software",
        "Client Entertainment",
        "Training",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    // Approval workflow fields
    approvals: [
      {
        approver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String },
        decision: { type: String, enum: ["approved", "rejected"], required: false },
        comment: { type: String },
        actedAt: { type: Date },
      },
    ],
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", default: null },
    currentStep: { type: Number, default: 0 },
    isManagerApprover: { type: Boolean, default: true },
    rejectionReason: {
      type: String,
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ submittedBy: 1, status: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
