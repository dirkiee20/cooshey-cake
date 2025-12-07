const { DataTypes } = require('sequelize');

// Use the global sequelize instance
const sequelize = global.sequelize;

const AdminNotification = sequelize.define('AdminNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'new_order',
      'new_user',
      'payment_issue',
      'low_inventory',
      'system_error',
      'general'
    ),
    allowNull: false,
    defaultValue: 'general',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true, // ID of related entity (order, user, payment, etc.)
  },
  relatedType: {
    type: DataTypes.ENUM('order', 'user', 'payment', 'product', 'system'),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true, // Additional data for the notification
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['isRead']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = AdminNotification;