const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (you will need to create a User model for this)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Always check admin status from database, not from cached JWT
    const User = require('../models/userModel');
    const user = await User.findByPk(req.user.id);

    if (user && user.isAdmin) {
      // Update req.user with fresh data from database
      req.user = user.toJSON();
      next();
    } else {
      res.status(401);
      throw new Error('Not authorized as an admin');
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };