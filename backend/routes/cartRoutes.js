const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItem,
    deleteCartItem
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// All cart routes are protected and require a logged-in user
router.use(protect);

router.route('/')
    .get(getCart)
    .post(addItemToCart);

router.route('/:productId')
    .put(updateCartItem)
    .delete(deleteCartItem);

module.exports = router;