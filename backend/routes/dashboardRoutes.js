const express = require('express');
const router = express.Router();
const { Order, OrderItem } = require('../models/orderModel');
const Product = require('../models/Product');
const User = require('../models/userModel');
const Log = require('../models/Log');
const Payment = require('../models/Payment');
const { Op, fn, col, literal } = require('sequelize');

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get total revenue (from completed payments)
    const totalRevenueResult = await Payment.sum('amount', {
      where: {
        status: 'confirmed',
        createdAt: { [Op.gte]: startDate }
      }
    }) || 0;

    // Get total orders
    const totalOrders = await Order.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Get products sold - simplified query to avoid association issues
    const productsSoldResult = await OrderItem.sum('quantity', {
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    }) || 0;

    // Get total customers
    const totalCustomers = await User.count({
      where: {
        isAdmin: false,
        createdAt: { [Op.gte]: startDate }
      }
    });

    res.json({
      totalRevenue: parseFloat(totalRevenueResult),
      totalOrders,
      productsSold: productsSoldResult,
      totalCustomers
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const logs = await Log.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['name']
      }]
    });

    const activities = logs.map(log => ({
      id: log.id,
      type: log.entityType,
      action: log.action,
      message: `${log.action} ${log.entityType}: ${log.entityName}`,
      time: log.createdAt,
      user: log.user ? log.user.name : 'System'
    }));

    res.json(activities);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({ message: 'Failed to get recent activity' });
  }
});

// Get sales chart data
router.get('/sales-chart', async (req, res) => {
  try {
    const period = req.query.period || '7d';
    let labels, data, dateCondition, groupBy;

    switch (period) {
      case '7d':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dateCondition = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupBy = fn('DAYOFWEEK', col('createdAt'));

        const dailySales = await Payment.findAll({
          attributes: [
            [groupBy, 'dayOfWeek'],
            [fn('SUM', col('amount')), 'total']
          ],
          where: {
            status: 'confirmed',
            createdAt: { [Op.gte]: dateCondition }
          },
          group: [groupBy],
          order: [[groupBy, 'ASC']],
          raw: true
        });

        // Initialize data array with zeros
        data = [0, 0, 0, 0, 0, 0, 0];

        // Map results (MySQL DAYOFWEEK: 1=Sunday, 2=Monday, ..., 7=Saturday)
        dailySales.forEach(item => {
          const dayIndex = (parseInt(item.dayOfWeek) + 5) % 7; // Convert to Monday=0
          data[dayIndex] = parseFloat(item.total) || 0;
        });
        break;

      case '30d':
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        dateCondition = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = fn('WEEK', col('createdAt'));

        const weeklySales = await Payment.findAll({
          attributes: [
            [groupBy, 'weekNum'],
            [fn('SUM', col('amount')), 'total']
          ],
          where: {
            status: 'confirmed',
            createdAt: { [Op.gte]: dateCondition }
          },
          group: [groupBy],
          order: [[groupBy, 'ASC']],
          raw: true
        });

        data = [0, 0, 0, 0];
        const currentWeek = Math.ceil(new Date().getDate() / 7);

        weeklySales.forEach(item => {
          const weekIndex = currentWeek - parseInt(item.weekNum);
          if (weekIndex >= 0 && weekIndex < 4) {
            data[3 - weekIndex] = parseFloat(item.total) || 0; // Reverse order
          }
        });
        break;

      case '90d':
        labels = ['Month 1', 'Month 2', 'Month 3'];
        dateCondition = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupBy = fn('MONTH', col('createdAt'));

        const monthlySales = await Payment.findAll({
          attributes: [
            [groupBy, 'monthNum'],
            [fn('SUM', col('amount')), 'total']
          ],
          where: {
            status: 'confirmed',
            createdAt: { [Op.gte]: dateCondition }
          },
          group: [groupBy],
          order: [[groupBy, 'ASC']],
          raw: true
        });

        data = [0, 0, 0];
        const currentMonth = new Date().getMonth() + 1;

        monthlySales.forEach(item => {
          const monthIndex = currentMonth - parseInt(item.monthNum);
          if (monthIndex >= 0 && monthIndex < 3) {
            data[2 - monthIndex] = parseFloat(item.total) || 0; // Reverse order
          }
        });
        break;

      default:
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        data = [0, 0, 0, 0, 0, 0, 0];
    }

    res.json({ labels, data });
  } catch (error) {
    console.error('Error getting sales chart data:', error);
    // Return empty data instead of mock data
    res.json({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [0, 0, 0, 0, 0, 0, 0]
    });
  }
});

// Get products chart data (most popular products)
router.get('/products-chart', async (req, res) => {
  try {
    // Get top 5 products by sales from order items
    const productSales = await OrderItem.findAll({
      attributes: [
        [fn('SUM', col('quantity')), 'totalSold']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name']
      }],
      group: ['productId'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 5,
      raw: true
    });

    const labels = productSales.map(item => item['product.name'] || 'Unknown Product');
    const data = productSales.map(item => parseInt(item.totalSold) || 0);

    // Return real data or empty arrays if no data
    res.json({ labels, data });
  } catch (error) {
    console.error('Error getting products chart data:', error);
    // Return empty data instead of mock data
    res.json({
      labels: [],
      data: []
    });
  }
});

module.exports = router;