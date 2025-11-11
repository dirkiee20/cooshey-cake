const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', loginUser);

module.exports = router;