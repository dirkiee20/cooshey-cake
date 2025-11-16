const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Generate JWT
const generateToken = (id) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

router.route('/').post(registerUser).get(protect, admin, getUsers);
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

// Make current user admin (temporary for development)
router.post('/make-admin', protect, async (req, res) => {
  try {
    console.log('make-admin: req.user:', req.user);
    console.log('make-admin: user id:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('make-admin: No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await require('../models/userModel').findByPk(req.user.id);
    if (!user) {
      console.log('make-admin: User not found for id:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('make-admin: Updating user admin status');
    await user.update({ isAdmin: true });

    console.log('make-admin: User updated successfully');
    res.json({
      message: 'You are now an admin. Admin status is checked from database on every request.',
      isAdmin: true
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;