// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

const protect = async (req, res, next) => {
  let token;

  // 1) Try from Authorization header: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2) (Optional) Support cookie named "jwt" as fallback
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support different payload layouts
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Not authorized, invalid token payload' });
    }

    req.user = await User.findById(userId).select('-password');

    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('JWT verify error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * @desc Check admin role (if you need it)
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res
      .status(403)
      .json({ message: 'Access denied. Admin role required.' });
  }
};

module.exports = { protect, isAdmin };
