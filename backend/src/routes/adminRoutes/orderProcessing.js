const express = require('express');
const router = express.Router();
const OrderProcessingController = require('../../controllers/orderProcessingController');
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

module.exports = router;