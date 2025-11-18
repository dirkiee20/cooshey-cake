const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { Order } = require('../models/orderModel');
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

// Create payment record
router.post('/', async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, notes } = req.body;
    console.log('Creating payment record:', { orderId, amount, paymentMethod, notes });

    const payment = await Payment.create({
      orderId,
      amount,
      paymentMethod: paymentMethod || 'gcash',
      notes,
      status: 'pending'
    });

    console.log('Payment record created:', payment.id);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Upload payment proof
router.post('/:id/proof', upload.single('receipt'), async (req, res) => {
  try {
    const paymentId = req.params.id;
    const receiptImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const { reference, payment_method, notes } = req.body;

    console.log('Uploading payment proof:', {
      paymentId,
      hasFile: !!req.file,
      fileName: req.file?.filename,
      receiptImageUrl,
      reference,
      payment_method,
      notes
    });

    const updateData = {
      receiptImageUrl,
      status: 'pending'
    };

    if (reference) {
      updateData.gcashReference = reference;
    }

    if (payment_method) {
      updateData.paymentMethod = payment_method;
    }

    if (notes) {
      updateData.notes = notes;
    }

    await Payment.update(updateData, {
      where: { id: paymentId }
    });

    console.log('Payment proof uploaded for payment:', paymentId);
    res.json({ message: 'Payment proof uploaded successfully' });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ message: 'Failed to upload payment proof' });
  }
});

// Get payment by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { orderId: req.params.orderId }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ message: 'Failed to get payment' });
  }
});

// Get all payments (temporarily no auth for debug)
router.get('/', async (req, res) => {
    try {
        console.log('Getting payments...');
        const payments = await Payment.findAll({
            include: [{
                model: require('../models/orderModel').Order,
                as: 'order'
            }],
            order: [['createdAt', 'DESC']]
        });

        console.log('Payments found:', payments.length);

        // Add status tracking information
        const paymentsWithTracking = payments.map(payment => ({
            ...payment.toJSON(),
            statusHistory: [
                {
                    status: payment.status,
                    timestamp: payment.createdAt,
                    note: 'Payment record created'
                }
            ]
        }));

        res.json(paymentsWithTracking);
    } catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({ message: 'Failed to get payments' });
    }
});

// Admin: Update payment status
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    console.log('Updating payment status:', { paymentId: req.params.id, status, notes });

    // Get the payment to find the order
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await Payment.update({
      status,
      notes
    }, {
      where: { id: req.params.id }
    });

    // If payment is confirmed, create notification for the user
    if (status === 'confirmed') {
      try {
        const order = await Order.findByPk(payment.orderId);
        if (order) {
          await Notification.create({
            userId: order.userId,
            message: `Your payment for Order #${payment.orderId} has been confirmed. Your order is now being processed.`,
            type: 'payment_confirmed',
            relatedId: payment.orderId,
            relatedType: 'order'
          });
          console.log('Notification created for user:', order.userId);
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the payment update if notification fails
      }
    }

    console.log('Payment status updated:', req.params.id);
    res.json({ message: 'Payment status updated' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Failed to update payment status' });
  }
});

module.exports = router;
