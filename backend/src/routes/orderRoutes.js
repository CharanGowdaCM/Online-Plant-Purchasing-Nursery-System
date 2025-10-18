const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const OrderCancellationController = require('../controllers/orderCancellationController'); // Import the OrderCancellationController
const { verifyToken } = require('../middleware/auth');

router.post('/create', verifyToken, OrderController.createOrder);
router.post('/:orderId/payment', verifyToken, OrderController.updateOrderPayment);
router.get('/:orderId/payment-options', verifyToken, OrderController.getPaymentOptions);  // Add this route
router.get('/orders/user', verifyToken, OrderController.getUserOrders);
router.get('/orders/user/:orderId', verifyToken, OrderController.getUserOrderDetails);

router.post('/:orderId/cancel', 
  verifyToken, 
  OrderCancellationController.cancelOrder
);

module.exports = router;