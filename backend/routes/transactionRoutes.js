const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
} = require('../controllers/transactionController');

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Private/Admin (temporarily no auth for debug)
router.get('/', getTransactions);

// @route   GET /api/transactions/:id
// @desc    Get a single transaction by ID
// @access  Private/Admin
router.get('/:id', getTransactionById);

module.exports = router;