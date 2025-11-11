const { DataTypes } = require('sequelize');

// Use the global sequelize instance
const sequelize = global.sequelize;

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('gcash'),
    defaultValue: 'gcash',
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
    defaultValue: 'pending',
  },
  receiptImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gcashReference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

// Define associations
Payment.belongsTo(require('./orderModel').Order, { foreignKey: 'orderId', as: 'order' });
require('./orderModel').Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });

module.exports = Payment;