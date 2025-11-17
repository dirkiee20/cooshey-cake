const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  validateRegistration,
  handleValidationErrors
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Security fix: Add rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate JWT
const generateToken = (id) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

router.route('/').post(validateRegistration, handleValidationErrors, registerUser).get(protect, admin, getUsers);
router.post('/login', loginUser);

// Make user admin (temporary route for development)
router.put('/:id/admin', protect, admin, async (req, res) => {
  try {
    const user = await require('../models/userModel').findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isAdmin: true });
    res.json({ message: 'User made admin successfully' });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Security fix: Removed temporary /make-admin route to prevent unauthorized admin elevation

module.exports = router;