const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Private/Admin
router.get('/', protect, admin, getTransactions);

// @route   GET /api/transactions/:id
// @desc    Get a single transaction by ID
// @access  Private/Admin
router.get('/:id', protect, admin, getTransactionById);

module.exports = router;