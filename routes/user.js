const express = require('express');
const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { authMiddleware, isSuperadminMiddleware } = require('../middleware/auth');

const router = express.Router();
const secretKey = 'your_secret_key';



// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullname, username } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const resolvedFullname = typeof fullname === 'string' && fullname.trim()
      ? fullname.trim()
      : (typeof username === 'string' ? username.trim() : '');

    if (!resolvedFullname) {
      return res.status(400).json({ error: 'Fullname is required' });
    }

    await User.create({ email: normalizedEmail, password, fullname: resolvedFullname });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const hasEmailFormatIssue = Array.isArray(err.errors)
        && err.errors.some((error) => error.path === 'email' && error.validatorKey === 'isEmail');

      if (hasEmailFormatIssue) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

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


module.exports = router;