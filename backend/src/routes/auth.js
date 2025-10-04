const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

// POST /api/auth/register-company
// body: { companyName, country, currency, adminName, adminEmail, adminPassword }
router.post("/register-company", async (req, res) => {
  try {
    const {
      companyName,
      country,
      currency,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;
    if (
      !companyName ||
      !country ||
      !currency ||
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

    const company = new Company({ name: companyName, country, currency });
    await company.save();

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: hashed,
      role: "admin",
      roleName: "admin", // keep roleName in sync
      company: company._id,
    });
    await admin.save();

    return res.status(201).json({
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
    // ensure roleName is populated (backfill legacy docs)
    if (!user.roleName) {
      user.roleName = user.role;
      try { await user.save(); } catch (e) { /* ignore */ }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        roleName: user.roleName,
        companyId: user.company._id,
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
        roleName: user.roleName,
        company: {
          id: user.company._id,
          name: user.company.name,
          currency: user.company.currency,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me - return server-side view of current authenticated user (debug / client sync)
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('company').select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: user.roleName,
        company: user.company ? {
          id: user.company._id,
          name: user.company.name,
          currency: user.company.currency
        } : null
      },
      tokenClaims: req.user
    });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password
// body: { currentPassword, newPassword }
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
