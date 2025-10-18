const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.post('/initiate', verifyToken, PaymentController.initiatePayment);
router.post('/verify', verifyToken, PaymentController.verifyPayment);

module.exports = router;