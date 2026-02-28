const express = require('express');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [users, pets] = await Promise.all([User.count(), Pet.count()]);
    res.status(200).json({ users, pets });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
