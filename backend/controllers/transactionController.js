const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction.js');

/**
 * @desc    Fetch all transactions
 * @route   GET /api/transactions
 * @access  Private/Admin
 */
const getTransactions = asyncHandler(async (req, res) => {
  console.log('=== GET TRANSACTIONS START ===');
  const transactions = await Transaction.findAll({
    order: [['createdAt', 'DESC']]
  });
  console.log('Transactions found:', transactions.length);
  console.log('Transaction IDs:', transactions.map(t => t.id));
  console.log('=== GET TRANSACTIONS END ===');
  res.json(transactions);
});

/**
 * @desc    Fetch a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private/Admin
 */
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByPk(req.params.id);

  if (transaction) {
    res.json(transaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

module.exports = {
  getTransactions,
  getTransactionById,
};