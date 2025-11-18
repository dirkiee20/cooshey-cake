const { DataTypes } = require('sequelize');

// Use the global sequelize instance
const sequelize = global.sequelize;

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('payment_confirmed', 'payment_rejected', 'order_update', 'general'),
    allowNull: false,
    defaultValue: 'general',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true, // ID of related entity (order, payment, etc.)
  },
  relatedType: {
    type: DataTypes.ENUM('order', 'payment', 'product'),
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Notification;