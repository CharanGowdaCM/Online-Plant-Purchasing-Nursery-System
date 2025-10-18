const supabase = require('../config/supabase');

class PaymentModel {
  static async createTransaction({
    orderId,
    transactionId,
    paymentGateway,
    amount,
    currency,
    status,
    gatewayResponse
  }) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: orderId,
        transaction_id: transactionId,
        payment_gateway: paymentGateway,
        amount,
        currency,
        status,
        gateway_response: gatewayResponse
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTransaction(transactionId, {
    status,
    paymentMethod,
    paidAt,
    refundedAt,
    failureReason,
    gatewayResponse
  }) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({
        status,
        payment_method: paymentMethod,
        paid_at: paidAt,
        refunded_at: refundedAt,
        failure_reason: failureReason,
        gateway_response: gatewayResponse,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = PaymentModel;