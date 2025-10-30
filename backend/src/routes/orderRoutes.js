const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const OrderCancellationController = require('../controllers/orderCancellationController'); 
const InvoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/auth');

router.post('/create', verifyToken, OrderController.createOrder);
router.post('/:orderId/payment', verifyToken, OrderController.updateOrderPayment);
router.get('/:orderId/payment-options', verifyToken, OrderController.getPaymentOptions);  
router.get('/user', verifyToken, OrderController.getUserOrders);
router.get('/user/:orderId', verifyToken, OrderController.getUserOrderDetails);
router.get('/:orderId/invoice', verifyToken, InvoiceController.downloadInvoice);

router.post('/:orderId/cancel', 
  verifyToken, 
  OrderCancellationController.cancelOrder
);

module.exports = router;