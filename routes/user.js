const express = require('express');
const jwt = require('jwt-simple');
const { User } = require('../models/user');
const { Pet } = require('../models/pet');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const secretKey = 'your_secret_key';

const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullname } = req.body;
    await User.create({ email, password, fullname });
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

router.get('/user-stats', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'issuperadmin'] });
    return res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all pets for a user (must be before generic /:id routes)
router.get('/:id/pets', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pets = await Pet.findAll({ where: { userId: Number(id) } });
    res.json(
      pets.map((pet) => {
        const plain = pet.toJSON();
        return {
          ...plain,
          userId: plain.userId ?? null,
          fullname: user.fullname,
        };
      })
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update User (PUT)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!isValidId(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (req.user.id !== userId && !req.user.issuperadmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, fullname } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.email = email || user.email;
    user.fullname = fullname || user.fullname;

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Partially Update User (PATCH)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!isValidId(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (req.user.id !== userId && !req.user.issuperadmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { issuperadmin, email, fullname } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.email = email || user.email;
    user.fullname = fullname || user.fullname;

    if (typeof issuperadmin !== 'undefined') {
      user.issuperadmin = issuperadmin;
    }

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'fullname', 'email', 'issuperadmin'] });
    return res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete User
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    return res.status(204).end();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
