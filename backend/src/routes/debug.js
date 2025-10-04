const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Simple debug route to see what the server thinks about the caller
router.get('/whoami', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
