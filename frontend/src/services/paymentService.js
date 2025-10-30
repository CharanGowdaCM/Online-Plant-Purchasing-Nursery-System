// Developer: M Lakshya
// Features: Payment initiation, payment verification, Razorpay integration, secure transaction handling, order payment processing


import api from './api';

class PaymentService {
  static async initiatePayment(amount, orderId) {
    try {
      const response = await api.post('/payments/initiate', { amount, orderId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
  try {
    const response = await api.post('/payments/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
}

export default PaymentService;