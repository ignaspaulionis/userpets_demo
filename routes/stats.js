const express = require('express');
const router = express.Router();

const { basicAuthMiddleware } = require('../middleware/auth');
const User = require('../models/user');
const { Pet } = require('../models/pet');

router.get('/stats', basicAuthMiddleware, async (req, res) => {
  try {
    const [users, pets] = await Promise.all([User.count(), Pet.count()]);
    return res.status(200).json({ users, pets });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
