const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const { authenticate, isAdmin } = require('../middleware/auth');

// List roles for company
router.get('/', authenticate, async (req, res) => {
  try {
    const roles = await Role.find({ company: req.user.companyId }).sort({ isSystem: -1, name: 1 });
    return res.json({ roles });

  } catch (e) {
    console.error(e); return res.status(500).json({ message: 'Server error'});
  }
});
// Create role
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, displayName, isApprover } = req.body;
    if (!name) return res.status(400).json({ message: 'Role name required'});
    const norm = name.toLowerCase().trim();
    if ([ 'admin', 'employee' ].includes(norm)) {
      return res.status(400).json({ message: 'System role already exists'});
    }
    const role = new Role({ company: req.user.companyId, name: norm, displayName: displayName || name, isApprover: !!isApprover });
    await role.save();
    return res.status(201).json({ message: 'Role created', role });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Role already exists'});
    console.error(e); return res.status(500).json({ message: 'Server error'});
  }
});

// Update role
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { displayName, isApprover } = req.body;
    const role = await Role.findOne({ _id: req.params.id, company: req.user.companyId, isSystem: false });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (displayName) role.displayName = displayName;
    if (isApprover !== undefined) role.isApprover = !!isApprover;
    await role.save();
    return res.json({ message: 'Role updated', role });
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Server error'}); }
});

// Delete role
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, company: req.user.companyId, isSystem: false });
    if (!role) return res.status(404).json({ message: 'Role not found'});
    const User = require('../models/User');
    const Workflow = require('../models/Workflow');
    const userRefCount = await User.countDocuments({ company: req.user.companyId, role: role.name });
    const wfRefCount = await Workflow.countDocuments({ company: req.user.companyId, 'steps.approverType': 'role', 'steps.approverRole': role.name });
    if (userRefCount > 0 || wfRefCount > 0) {
      return res.status(400).json({ message: 'Role is in use and cannot be deleted', userRefCount, workflowRefCount: wfRefCount });
    }
    await Role.deleteOne({ _id: role._id });
    return res.json({ message: 'Role deleted' });
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Server error'}); }
});

module.exports = router;