const { Cart, CartItem } = require('../models/cartModel');
const Product = require('../models/Product');

// Helper function to format cart for response by constructing absolute image URLs
const formatCartResponse = (cart, req) => {
  if (!cart) return { items: [] };
  const cartObject = cart.toJSON();
  cartObject.items = cartObject.items.map(item => {
    if (item.product && item.product.imageUrl) {
      // Ensure imageUrl is an absolute path
      if (!item.product.imageUrl.startsWith('http')) {
        item.product.imageUrl = `${req.protocol}://${req.get('host')}${item.product.imageUrl}`;
      }
    }
    return item;
  });
  return cartObject;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id });
      return res.json({ items: [] });
    }

    // Data Integrity: Filter out items where the product has been deleted
    const originalItemCount = cart.items.length;
    cart.items = cart.items.filter(item => item.product);

    // If any items were removed, save the cleaned cart for future requests
    if (cart.items.length < originalItemCount) {
      // Remove orphaned cart items
      const validProductIds = cart.items.map(item => item.productId);
      await CartItem.destroy({
        where: {
          cartId: cart.id,
          productId: { [require('sequelize').Op.notIn]: validProductIds }
        }
      });
    }

    res.json(formatCartResponse(cart, req));
  } catch (error) {
    console.error('Get Cart Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addItemToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      // Cart exists, check if product is already in cart
      const existingItem = await CartItem.findOne({
        where: { cartId: cart.id, productId: productId }
      });

      if (existingItem) {
        // Product exists in cart, update quantity
        existingItem.quantity += quantity;
        await existingItem.save();
      } else {
        // Product not in cart, add new item
        await CartItem.create({
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        });
      }
    } else {
      // No cart for user, create new cart
      cart = await Cart.create({ userId: req.user.id });
      await CartItem.create({
        cartId: cart.id,
        productId: productId,
        quantity: quantity
      });
    }

    const populatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });
    res.status(201).json(formatCartResponse(populatedCart, req));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      const cartItem = await CartItem.findOne({
        where: { cartId: cart.id, productId: productId }
      });

      if (cartItem) {
        cartItem.quantity = quantity;
        await cartItem.save();
        const populatedCart = await Cart.findOne({
          where: { id: cart.id },
          include: [{
            model: CartItem,
            as: 'items',
            include: [{
              model: Product,
              as: 'product'
            }]
          }]
        });
        return res.json(formatCartResponse(populatedCart, req));
      }
    }
    res.status(404).json({ message: 'Item not in cart' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const deleteCartItem = async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      await CartItem.destroy({
        where: { cartId: cart.id, productId: productId }
      });
      const populatedCart = await Cart.findOne({
        where: { id: cart.id },
        include: [{
          model: CartItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      });
      return res.json(formatCartResponse(populatedCart, req));
    }
    res.status(404).json({ message: 'Cart not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
};