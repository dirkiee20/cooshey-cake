const { DataTypes } = require('sequelize');

// Use the global sequelize instance
const sequelize = global.sequelize;

const StockTransaction = sequelize.define('StockTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('stock_in', 'stock_out', 'adjustment', 'sale', 'return'),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Order ID, supplier invoice, etc.'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
}, {
  timestamps: true,
});

// Define associations
StockTransaction.belongsTo(require('./Product'), { foreignKey: 'productId', as: 'product' });
StockTransaction.belongsTo(require('./userModel'), { foreignKey: 'adminId', as: 'admin' });

module.exports = StockTransaction;