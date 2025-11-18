const { Order, OrderItem } = require('../models/orderModel');
const { Cart, CartItem } = require('../models/cartModel');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const { items, total, shippingInfo } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error('No items provided for order');
    }

    if (!total || total <= 0) {
        res.status(400);
        throw new Error('Invalid total amount');
    }

    if (!shippingInfo || !shippingInfo.address || !shippingInfo.contact) {
        res.status(400);
        throw new Error('Shipping information is required');
    }

    // Check stock availability for all items
    for (const item of items) {
        if (!item.product || !item.product.id) {
            throw new Error('Invalid product in order items');
        }
        const product = await Product.findByPk(item.product.id);
        if (!product) {
            throw new Error(`Product ${item.product.id} not found`);
        }
        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
    }

    // Combine address and contact for shippingAddress field
    const shippingAddress = `${shippingInfo.address}\nContact: ${shippingInfo.contact}`;

    // Create the order
    const order = await Order.create({
        userId: req.user.id,
        totalAmount: total,
        shippingAddress: shippingAddress,
        paymentMethod: 'GCash', // Default to GCash for now
        status: 'Pending'
    });

    // Create order items
    const orderItems = await Promise.all(
        items.map(async (item) => {
            return await OrderItem.create({
                orderId: order.id,
                productId: item.product.id,
                quantity: item.quantity
            });
        })
    );

    // Subtract stock and create stock transactions
    for (const item of items) {
        const product = await Product.findByPk(item.product.id);
        const previousStock = product.stock;
        const newStock = previousStock - item.quantity;

        // Create stock transaction
        await StockTransaction.create({
            productId: item.product.id,
            type: 'sale',
            quantity: item.quantity,
            previousStock,
            newStock,
            reference: `Order #${order.id}`,
            notes: `Order placed - Order #${order.id}`,
            adminId: req.user.id // Assuming user is admin or handle differently
        });

        // Update product stock
        await Product.update({ stock: newStock }, { where: { id: item.product.id } });
    }

    // Remove ordered items from cart
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) {
        const productIds = items.map(item => item.product.id);
        await CartItem.destroy({
            where: {
                cartId: cart.id,
                productId: { [require('sequelize').Op.in]: productIds }
            }
        });
    }

    // Fetch the complete order with relationships
    const populatedOrder = await Order.findByPk(order.id, {
        include: [{
            model: require('../models/userModel'),
            as: 'user',
            attributes: ['id', 'name']
        }, {
            model: OrderItem,
            as: 'items',
            include: [{
                model: require('../models/Product'),
                as: 'product'
            }]
        }]
    });

    res.status(201).json({
        order: populatedOrder
    });
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [{
            model: require('../models/userModel'),
            as: 'user',
            attributes: ['id', 'name']
        }, {
            model: OrderItem,
            as: 'items',
            include: [{
                model: require('../models/Product'),
                as: 'product'
            }]
        }]
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Format response to match payment.js expectations
    const orderData = order.toJSON();
    const formattedOrder = {
        id: orderData.id,
        total: parseFloat(orderData.totalAmount),
        items: orderData.items.map(item => ({
            name: item.product ? item.product.name : 'Unknown',
            price: parseFloat(item.product ? item.product.price : 0),
            quantity: item.quantity,
            product: item.product
        }))
    };

    res.json(formattedOrder);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        include: [{
            model: require('../models/userModel'),
            as: 'user',
            attributes: ['id', 'name']
        }, {
            model: OrderItem,
            as: 'items',
            include: [{
                model: require('../models/Product'),
                as: 'product'
            }]
        }]
    });
    res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    order.status = req.body.status;
    await order.save();

    res.json(order);
});

module.exports = { createOrder, getOrderById, getOrders, updateOrderStatus };