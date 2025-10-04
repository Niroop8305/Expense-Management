const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const User = require("../models/User");

// Minimal mapping of country to currency. Extend as needed.
const countryCurrency = {
  US: "USD",
  IN: "INR",
  GB: "GBP",
  EU: "EUR",
};

// POST /api/auth/register-company
// body: { companyName, country, adminName, adminEmail, adminPassword }
router.post("/register-company", async (req, res) => {
  try {
    const { companyName, country, adminName, adminEmail, adminPassword } =
      req.body;
    if (
      !companyName ||
      !country ||
      !adminName ||
      !adminEmail ||
      !adminPassword
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // check if user email already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const currency = countryCurrency[country] || "USD";

    const company = new Company({ name: companyName, country, currency });
    await company.save();

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: hashed,
      role: "admin",
      company: company._id,
    });
    await admin.save();

    return res
      .status(201)
      .json({
        message: "Company and admin created",
        company: {
          id: company._id,
          name: company.name,
          currency: company.currency,
        },
        admin: { id: admin._id, email: admin.email, name: admin.name },
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
// body: { email, password }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user by email and populate company details
    const user = await User.findOne({ email }).populate("company");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        companyId: user.company._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: user.company._id,
          name: user.company.name,
          currency: user.company.currency
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
