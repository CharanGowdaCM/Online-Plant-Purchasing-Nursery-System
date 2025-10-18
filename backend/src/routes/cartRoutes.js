const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

// All cart routes require authentication
router.use(verifyToken);

// Cart routes
router.get('/', CartController.getCart);
router.post('/items', CartController.addToCart);
router.patch('/items/:cartItemId', CartController.updateCartItem);
router.delete('/items/:cartItemId', CartController.removeFromCart);
router.delete('/', CartController.clearCart);

module.exports = router;