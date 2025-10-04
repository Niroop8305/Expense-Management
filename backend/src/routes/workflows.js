const express = require("express");
const router = express.Router();
const Workflow = require("../models/Workflow");
const { authenticate, isAdmin } = require("../middleware/auth");

// POST /api/workflows - Admin creates approval workflow for their company
router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, steps, rules } = req.body;
    if (!name || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: "Name and steps are required" });
    }

    const workflow = new Workflow({
      company: req.user.companyId,
      name,
      steps,
      rules: rules || { type: "none" },
    });

    await workflow.save();

    return res.status(201).json({ message: "Workflow created", workflow });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/workflows/:companyId - Fetch workflow config for that company
router.get("/:companyId", authenticate, async (req, res) => {
  try {
    const { companyId } = req.params;
    // allow only company users to fetch their company workflows
    if (companyId !== req.user.companyId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const workflows = await Workflow.find({ company: companyId }).sort({ createdAt: -1 });
    return res.status(200).json({ workflows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
