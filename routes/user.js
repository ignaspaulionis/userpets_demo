const express = require('express');
const jwt = require('jwt-simple');

const User = require('../models/user');
const { authMiddleware, isSuperadminMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema, userSchema } = require('../validation/userValidation');

const router = express.Router();

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET is required');
}

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullname: user.fullname,
  issuperadmin: user.issuperadmin,
});

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
  }
  req.body = value;
  next();
};

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, fullname } = req.body;
    await User.create({ email, password, fullname });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
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
    next(err);
  }
});

router.put('/:id', authMiddleware, validateBody(registerSchema), async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (req.user.id !== targetUserId && !req.user.issuperadmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.email = req.body.email;
    user.fullname = req.body.fullname;
    user.password = req.body.password;

    await user.save();
    res.json({ message: 'User updated successfully', user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authMiddleware, validateBody(userSchema), async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (req.user.id !== targetUserId && !req.user.issuperadmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.fullname !== undefined) user.fullname = req.body.fullname;
    if (req.body.password !== undefined) user.password = req.body.password;

    if (req.body.issuperadmin !== undefined) {
      if (!req.user.issuperadmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      user.issuperadmin = req.body.issuperadmin;
    }

    await user.save();
    res.json({ message: 'User updated successfully', user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/', authMiddleware, isSuperadminMiddleware, async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'fullname', 'email', 'issuperadmin'] });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/user-stats', authMiddleware, isSuperadminMiddleware, async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'issuperadmin'] });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
