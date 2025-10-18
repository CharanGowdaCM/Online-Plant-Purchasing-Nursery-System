const crypto = require('crypto');
const OrderModel = require('../models/orderModel');
const { sendOrderConfirmation } = require('../utils/notifications');

class WebhookController {
  static async handleRazorpayWebhook(req, res) {
    try {
      // Verify webhook signature
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'];
      
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (signature !== digest) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Process webhook event
      const event = req.body;
      
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentSuccess(event.payload.payment.entity);
          break;
          
        case 'payment.failed':
          await handlePaymentFailure(event.payload.payment.entity);
          break;
          
        case 'refund.processed':
          await handleRefundSuccess(event.payload.refund.entity);
          break;
          
        case 'order.paid':
          await handleOrderPaid(event.payload.order.entity);
          break;
          
        default:
          console.log('Unhandled webhook event:', event.event);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }
}

// Helper functions for handling different webhook events
async function handlePaymentSuccess(payment) {
  try {
    const order = await OrderModel.updateOrderStatus(
      payment.notes.orderId,
      'confirmed',
      {
        paymentId: payment.id,
        paymentMethod: payment.method,
        paymentAmount: payment.amount / 100,
        notes: 'Payment successful'
      }
    );

    // Send confirmation email
    const user = await AuthModel.getUserById(order.user_id);
    await sendOrderConfirmation(order, user);

  } catch (error) {
    console.error('Payment success handling error:', error);
    throw error;
  }
}

async function handlePaymentFailure(payment) {
  try {
    await OrderModel.updateOrderStatus(
      payment.notes.orderId,
      'payment_failed',
      {
        paymentId: payment.id,
        notes: `Payment failed: ${payment.error_description || 'Unknown error'}`
      }
    );
  } catch (error) {
    console.error('Payment failure handling error:', error);
    throw error;
  }
}

async function handleRefundSuccess(refund) {
  try {
    await OrderModel.updateOrderStatus(
      refund.notes.orderId,
      'refunded',
      {
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        notes: 'Refund processed successfully'
      }
    );
  } catch (error) {
    console.error('Refund handling error:', error);
    throw error;
  }
}

async function handleOrderPaid(orderData) {
  try {
    await OrderModel.updateOrderStatus(
      orderData.notes.orderId,
      'confirmed',
      {
        notes: 'Order payment confirmed via webhook'
      }
    );
  } catch (error) {
    console.error('Order paid handling error:', error);
    throw error;
  }
}

module.exports = WebhookController;