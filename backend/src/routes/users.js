const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authenticate, isAdmin } = require("../middleware/auth");

// GET /api/users - Get all users in the company (Admin only)
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ company: req.user.companyId })
      .populate("manager", "name email")
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/create-user - Create employee or manager (Admin only)
router.post("/create-user", authenticate, isAdmin, async (req, res) => {
  try {
  const { name, email, password, role, managerId } = req.body;
    console.log('[CREATE USER] Auth user:', req.user);

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Dynamic role validation: system roles always allowed; others must exist in Role collection
    const systemRoles = ["admin", "employee", "manager", "finance", "director"]; // existing known roles
    const Role = require('../models/Role');
    if (!systemRoles.includes(role)) {
      const existingRole = await Role.findOne({ company: req.user.companyId, name: role.toLowerCase() });
      if (!existingRole) return res.status(400).json({ message: 'Unknown role. Create it first via /api/roles' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // If managerId is provided, validate it exists
    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        company: req.user.companyId,
        role: { $in: ["manager", "admin"] },
      });

      if (!manager) {
        return res.status(400).json({ message: "Invalid manager ID" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      roleName: role, // sync dynamic naming field
      company: req.user.companyId,
      manager: managerId || null,
    });

    await newUser.save();

    // Return user without password
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      manager: newUser.manager,
      createdAt: newUser.createdAt,
    };

    console.log('[CREATE USER] Created user id:', newUser._id.toString());
    return res.status(201).json({
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } created successfully`,
      user: userResponse,
    });
  } catch (err) {
    console.error('[CREATE USER] Error:', err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, email, role, managerId } = req.body;
    const userId = req.params.id;

    const user = await User.findOne({
      _id: userId,
      company: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow changing admin role
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot modify admin user" });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) {
      const RoleModel = require('../models/Role');
      const systemRoles = ["admin", "employee", "manager", "finance", "director"]; 
      if (systemRoles.includes(role) || await RoleModel.findOne({ company: req.user.companyId, name: role.toLowerCase() })) {
        user.role = role;
        user.roleName = role;
      }
    }
    if (managerId !== undefined) user.manager = managerId || null;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findOne({
      _id: userId,
      company: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow deleting admin
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin user" });
    }

    await User.deleteOne({ _id: userId });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
