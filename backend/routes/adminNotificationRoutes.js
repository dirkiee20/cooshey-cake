const express = require('express');
const router = express.Router();
const AdminNotificationService = require('../services/adminNotificationService');
const { admin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/notifications
// @desc    Get all admin notifications
// @access  Private/Admin
router.get('/', admin, async (req, res) => {
  console.log('AdminNotificationRoutes: GET / called at', new Date().toISOString());
  console.log('AdminNotificationRoutes: User ID:', req.user?.id);
  console.log('AdminNotificationRoutes: Query params:', req.query);
  try {
    const limit = parseInt(req.query.limit) || 50;
    console.log('AdminNotificationRoutes: Fetching notifications with limit:', limit);
    const notifications = await AdminNotificationService.getAllNotifications(limit);
    console.log('AdminNotificationRoutes: Retrieved notifications count:', notifications.length);

    res.json(notifications);
  } catch (error) {
    console.error('AdminNotificationRoutes: Error getting admin notifications:', error);
    res.status(500).json({ message: 'Failed to get admin notifications' });
  }
});

// @route   GET /api/admin/notifications/unread-count
// @desc    Get count of unread admin notifications
// @access  Private/Admin
router.get('/unread-count', admin, async (req, res) => {
  console.log('AdminNotificationRoutes: GET /unread-count called at', new Date().toISOString());
  console.log('AdminNotificationRoutes: User ID for unread count:', req.user?.id);
  try {
    const count = await AdminNotificationService.getUnreadCount();
    console.log('AdminNotificationRoutes: Unread count result:', count);

    res.json({ count });
  } catch (error) {
    console.error('AdminNotificationRoutes: Error getting unread admin notification count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// @route   PUT /api/admin/notifications/:id/read
// @desc    Mark admin notification as read
// @access  Private/Admin
router.put('/:id/read', admin, async (req, res) => {
  try {
    const notification = await AdminNotificationService.markAsRead(req.params.id);

    res.json({ message: 'Admin notification marked as read', notification });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    if (error.message === 'Admin notification not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// @route   PUT /api/admin/notifications/read-all
// @desc    Mark all admin notifications as read
// @access  Private/Admin
router.put('/read-all', admin, async (req, res) => {
  try {
    const affectedRows = await AdminNotificationService.markAllAsRead();

    res.json({ message: 'All admin notifications marked as read', affectedRows });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// @route   POST /api/admin/notifications
// @desc    Create a new admin notification (for testing/manual creation)
// @access  Private/Admin
router.post('/', admin, async (req, res) => {
  try {
    const { title, message, type, priority, relatedId, relatedType, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notification = await AdminNotificationService.createNotification({
      title,
      message,
      type,
      priority,
      relatedId,
      relatedType,
      metadata
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating admin notification:', error);
    res.status(500).json({ message: 'Failed to create admin notification' });
  }
});

// @route   DELETE /api/admin/notifications/cleanup
// @desc    Delete old read notifications (cleanup)
// @access  Private/Admin
router.delete('/cleanup', admin, async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days) || 30;
    const deletedCount = await AdminNotificationService.deleteOldNotifications(daysOld);

    res.json({ message: `Deleted ${deletedCount} old notifications` });
  } catch (error) {
    console.error('Error cleaning up admin notifications:', error);
    res.status(500).json({ message: 'Failed to cleanup notifications' });
  }
});

module.exports = router;