const AdminNotification = require('../models/AdminNotification');

class AdminNotificationService {
  // Create a new admin notification
  static async createNotification(data) {
    try {
      const notification = await AdminNotification.create({
        title: data.title,
        message: data.message,
        type: data.type || 'general',
        priority: data.priority || 'medium',
        relatedId: data.relatedId || null,
        relatedType: data.relatedType || null,
        metadata: data.metadata || null,
      });

      console.log(`Admin notification created: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw error;
    }
  }

  // Get all admin notifications
  static async getAllNotifications(limit = 50) {
    try {
      const notifications = await AdminNotification.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit
      });

      return notifications;
    } catch (error) {
      console.error('Error getting admin notifications:', error);
      throw error;
    }
  }

  // Get unread notifications count
  static async getUnreadCount() {
    try {
      const count = await AdminNotification.count({
        where: { isRead: false }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread admin notification count:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const notification = await AdminNotification.findByPk(notificationId);

      if (!notification) {
        throw new Error('Admin notification not found');
      }

      await notification.update({ isRead: true });

      return notification;
    } catch (error) {
      console.error('Error marking admin notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead() {
    try {
      const result = await AdminNotification.update(
        { isRead: true },
        { where: { isRead: false } }
      );

      return result[0]; // Number of affected rows
    } catch (error) {
      console.error('Error marking all admin notifications as read:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await AdminNotification.destroy({
        where: {
          createdAt: { [require('sequelize').Op.lt]: cutoffDate },
          isRead: true
        }
      });

      console.log(`Deleted ${result} old admin notifications`);
      return result;
    } catch (error) {
      console.error('Error deleting old admin notifications:', error);
      throw error;
    }
  }

  // Predefined notification creators for common events

  // New order notification
  static async notifyNewOrder(orderId, orderData) {
    return this.createNotification({
      title: 'New Order Received',
      message: `Order #${orderId} has been placed by ${orderData.customerName || 'a customer'}. Total: ₱${orderData.total || 'N/A'}`,
      type: 'new_order',
      priority: 'high',
      relatedId: orderId,
      relatedType: 'order',
      metadata: orderData
    });
  }

  // New user registration notification
  static async notifyNewUser(userId, userData) {
    return this.createNotification({
      title: 'New User Registered',
      message: `${userData.name} (${userData.email}) has registered a new account.`,
      type: 'new_user',
      priority: 'medium',
      relatedId: userId,
      relatedType: 'user',
      metadata: userData
    });
  }

  // Payment issue notification
  static async notifyPaymentIssue(orderId, issueData) {
    return this.createNotification({
      title: 'Payment Issue Detected',
      message: `Payment issue with Order #${orderId}: ${issueData.message || 'Unknown issue'}`,
      type: 'payment_issue',
      priority: 'high',
      relatedId: orderId,
      relatedType: 'order',
      metadata: issueData
    });
  }

  // Low inventory alert
  static async notifyLowInventory(productId, productData) {
    return this.createNotification({
      title: 'Low Inventory Alert',
      message: `${productData.name} is running low on stock. Current quantity: ${productData.quantity}`,
      type: 'low_inventory',
      priority: 'medium',
      relatedId: productId,
      relatedType: 'product',
      metadata: productData
    });
  }

  // System error notification
  static async notifySystemError(errorData) {
    return this.createNotification({
      title: 'System Error',
      message: `A system error occurred: ${errorData.message || 'Unknown error'}`,
      type: 'system_error',
      priority: 'critical',
      relatedType: 'system',
      metadata: errorData
    });
  }
}

module.exports = AdminNotificationService;