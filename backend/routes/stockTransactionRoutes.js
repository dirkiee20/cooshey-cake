const express = require('express');
const router = express.Router();
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all stock transactions
router.get('/', protect, async (req, res) => {
    try {
        console.log('Getting stock transactions...');
        const transactions = await StockTransaction.findAll({
            include: [{
                model: Product,
                as: 'product'
            }, {
                model: require('../models/userModel'),
                as: 'admin'
            }],
            order: [['createdAt', 'DESC']]
        });

        console.log('Stock transactions found:', transactions.length);
        res.json(transactions);
    } catch (error) {
        console.error('Error getting stock transactions:', error);
        res.status(500).json({ message: 'Failed to get stock transactions' });
    }
});

// Create stock transaction
router.post('/', protect, admin, async (req, res) => {
    try {
        const { productId, type, quantity, reference, notes } = req.body;

        // Get current stock
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.stock;
        let newStock = previousStock;

        // Calculate new stock based on transaction type
        if (type === 'stock_in' || type === 'return') {
            newStock = previousStock + quantity;
        } else if (type === 'stock_out' || type === 'sale' || type === 'adjustment') {
            newStock = previousStock - quantity;
            if (newStock < 0) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
        }

        // Create transaction record
        const transaction = await StockTransaction.create({
            productId,
            type,
            quantity,
            previousStock,
            newStock,
            reference,
            notes,
            adminId: req.user.id
        });

        // Update product stock
        await Product.update({ stock: newStock }, { where: { id: productId } });

        console.log('Stock transaction created:', transaction.id);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating stock transaction:', error);
        res.status(500).json({ message: 'Failed to create stock transaction' });
    }
});

// Get stock transactions for specific product
router.get('/product/:productId', protect, admin, async (req, res) => {
    try {
        const transactions = await StockTransaction.findAll({
            where: { productId: req.params.productId },
            include: [{
                model: require('../models/userModel'),
                as: 'admin'
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error getting product transactions:', error);
        res.status(500).json({ message: 'Failed to get product transactions' });
    }
});

module.exports = router;