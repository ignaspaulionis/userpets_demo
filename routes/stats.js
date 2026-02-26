const express = require('express');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [users, pets] = await Promise.all([User.count(), Pet.count()]);
    return res.status(200).json({ users, pets });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
