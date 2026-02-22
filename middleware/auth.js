const jwt = require('jwt-simple');
const User = require('../models/user');

const secretKey = process.env.JWT_SECRET || secretKey;

// Middleware to check token (authMiddleware)
const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.decode(token, secretKey);
    const user = await User.findByPk(payload.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user; // Attach the user object to req for further use
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if the user is a superadmin (isSuperadminMiddleware)
const isSuperadminMiddleware = (req, res, next) => {
  if (!req.user.issuperadmin) {
    return res.status(403).json({ error: 'Access denied. Superadmin only.' });
  }
  next();
};

module.exports = { authMiddleware, isSuperadminMiddleware };
