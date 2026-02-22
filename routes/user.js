const express = require('express');
const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { authMiddleware, isSuperadminMiddleware } = require('../middleware/auth');

const router = express.Router();
const secretKey = 'your_secret_key';



// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullname } = req.body;
    const newUser = await User.create({ email, password, fullname });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user.id };
    const token = jwt.encode(payload, secretKey);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Update User (PUT)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { email, fullname } = req.body;
    if (req.user.id !== parseInt(req.params.id) && !req.user.issuperadmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.email = email || user.email;
    user.fullname = fullname;

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Partially Update User (PATCH)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { issuperadmin, email, fullname } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.email = email || user.email;
    user.fullname = fullname;

    if (typeof issuperadmin !== 'undefined') {
      user.issuperadmin = issuperadmin;
    }
    
    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Users (Superadmin Only)
router.get('/', authMiddleware, async (req, res) => {
    try {

      const users = await User.findAll({ attributes: ['id', 'fullname', 'email', 'issuperadmin'] });
      return res.json(users);

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

router.get('/user-stats', async (req, res) => {
    try {

      const users = await User.findAll({ attributes: ['id', 'email', 'issuperadmin'] });
      return res.json(users);

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

router.get('/:id/pets', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pets = await Pet.findAll({ where: { userId: id } });
    return res.json(pets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete User
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (req.user.id !== userId && !req.user.issuperadmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    return res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;