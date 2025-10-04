const jwt = require("jsonwebtoken");
const User = require('../models/User');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Always fetch user for freshest role (avoids stale token role issues for admin)
    const dbUser = await User.findById(decoded.userId).select('role roleName company');
    if (!dbUser) return res.status(401).json({ message: 'User no longer exists' });
    req.user = { ...decoded, role: dbUser.role, roleName: dbUser.roleName, companyId: decoded.companyId || (dbUser.company ? dbUser.company.toString() : undefined) };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  const claimRole = req.user.role || req.user.roleName;
  if (claimRole !== 'admin') return res.status(403).json({ message: 'Access denied. Admin only.' });
  return next();
};

// Middleware to check if user is manager or admin
const isManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Access denied. Manager or Admin only." });
  }
  next();
};

// Generic approver middleware: dynamic check; falls back to known defaults if Role collection not used
const Role = require('../models/Role');
const isApprover = async (req, res, next) => {
  try {
    const baseApproverList = ["admin", "manager", "finance", "director"]; // fallback
    if (baseApproverList.includes(req.user.role)) return next();
    // dynamic lookup
    const r = await Role.findOne({ company: req.user.companyId, name: req.user.role });
    if (r && r.isApprover) return next();
    return res.status(403).json({ message: "Access denied. Approver role required." });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authenticate, isAdmin, isManagerOrAdmin, isApprover };
