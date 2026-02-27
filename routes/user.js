const express = require('express');
const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { authMiddleware, isSuperadminMiddleware } = require('../middleware/auth');

const router = express.Router();
const secretKey = 'your_secret_key';

const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const serializeUserPet = (pet) => ({
  id: pet.id,
  name: pet.name,
  type: pet.type,
  age: pet.age,
  userId: pet.userId,
  fullname: pet.owner ? pet.owner.fullname : null,
  createdAt: pet.createdAt,
  updatedAt: pet.updatedAt,
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullname, fullName } = req.body;
    const normalizedFullname = typeof fullname !== 'undefined' ? fullname : fullName;

    if (typeof normalizedFullname !== 'string' || normalizedFullname.trim() === '') {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const newUser = await User.create({
      email,
      password,
      fullname: normalizedFullname.trim(),
    });
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

// Get pets for a user
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

    const pets = await Pet.findAll({
      where: { userId: user.id },
      include: [{ model: User, as: 'owner', attributes: ['id', 'fullname'] }],
      order: [['name', 'ASC']],
    });

    return res.json(pets.map(serializeUserPet));
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

// Delete user
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