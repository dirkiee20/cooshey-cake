const { DataTypes } = require('sequelize');

// Use the global sequelize instance
const sequelize = global.sequelize;

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  selected: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  timestamps: true,
});

// Define associations
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

CartItem.belongsTo(require('./Product'), { foreignKey: 'productId', as: 'product' });
require('./Product').hasMany(CartItem, { foreignKey: 'productId' });

Cart.belongsTo(require('./userModel'), { foreignKey: 'userId', as: 'user' });
require('./userModel').hasOne(Cart, { foreignKey: 'userId' });

module.exports = { Cart, CartItem };