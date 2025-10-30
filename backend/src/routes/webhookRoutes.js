const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

router.post('/razorpay', express.raw({ type: 'application/json' }), WebhookController.handleRazorpayWebhook);

module.exports = router;