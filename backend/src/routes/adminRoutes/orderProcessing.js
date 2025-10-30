/*
* Order Processing Routes - Admin order management
* Author: Lakshya M
* Routes: Process orders, update status
*/

const express = require('express');
const router = express.Router();
const OrderProcessingController = require('../../controllers/admin/orderProcessingController');
const { verifyToken, orderAdmin } = require('../../middleware/auth');

router.patch('/:orderId/status', 
  verifyToken, 
  orderAdmin, 
  OrderProcessingController.updateOrderStatus
);

router.get('/:orderId/history', 
  verifyToken, 
  orderAdmin, 
  OrderProcessingController.getOrderHistory
);

router.get('/orders', verifyToken, orderAdmin, OrderProcessingController.getAllOrders); 
router.get('/orders/:orderId', verifyToken, orderAdmin, OrderProcessingController.getOrderDetails);



module.exports = router;