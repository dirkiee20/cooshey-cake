const express = require('express');
const router = express.Router();
const { createOrder, getOrderById, getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Debug: Log route registration
console.log('Order routes loaded successfully');

// POST /api/orders - Create new order (must be before /:id route)
router.post('/', protect, createOrder);

// GET /api/orders - Get all orders (admin only)
router.get('/', protect, admin, getOrders);

// GET /api/orders/:id - Get single order
router.get('/:id', protect, getOrderById);

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;