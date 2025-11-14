const { DataTypes } = require('sequelize');

// Use the global sequelize instance
const sequelize = global.sequelize;

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.ENUM('add', 'edit', 'delete'),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('stock_in', 'stock_out'),
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quantityChange: {
    type: DataTypes.INTEGER,
    allowNull: true, // For edit actions, the change in stock
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true, // If we have admin users
  },
}, {
  timestamps: true,
});

module.exports = Transaction;