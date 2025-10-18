const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const PaymentModel = require('../models/paymentModel');

class PaymentController {
  static async initiatePayment(req, res) {
    try {
      const { amount, orderId } = req.body;

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: orderId,
        notes: {
          orderId: orderId
        }
      });

      // Create payment transaction record
      await PaymentModel.createTransaction({
        orderId,
        transactionId: razorpayOrder.id,
        paymentGateway: 'razorpay',
        amount: amount,
        currency: 'INR',
        status: 'pending',
        gatewayResponse: razorpayOrder
      });

      res.json({
        success: true,
        data: {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment initiation failed'
      });
    }
  }

  static async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        // Update transaction status to failed
        await PaymentModel.updateTransaction(razorpay_order_id, {
          status: 'failed',
          failureReason: 'Signature verification failed'
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Update transaction to completed
      await PaymentModel.updateTransaction(razorpay_order_id, {
        status: 'completed',
        paymentMethod: 'razorpay',
        paidAt: new Date().toISOString(),
        gatewayResponse: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature
        }
      });

      res.json({
        success: true,
        data: {
          paymentId: razorpay_payment_id
        }
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  }
}

module.exports = PaymentController;