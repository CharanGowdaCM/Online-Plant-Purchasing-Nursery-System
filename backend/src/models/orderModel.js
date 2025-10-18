const supabase = require('../config/supabase');
const InventoryModel = require('./inventoryModel');
const { generateTrackingId } = require('../utils/trackingGenerator');

class OrderModel {
  static async createOrder(userId, items, paymentDetails) {
    const trackingId = generateTrackingId();
    
    // Start database transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: `ORD${Date.now()}`,
        status: 'pending',
        payment_status: 'pending',
        total_amount: paymentDetails.amount / 100,
        tracking_number: trackingId,  // Add tracking number at creation
        placed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Log initial status in history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: order.id,
        status: 'pending',
        notes: 'Order placed successfully',
        tracking_number: trackingId
      });

    if (historyError) throw historyError;

    return order;
  }

  static async updateOrderStatus(orderId, status, details) {
    const timestampUpdates = {
      processing: { processing_started_at: new Date().toISOString() },
      packed: { packed_at: new Date().toISOString() },
      out_for_delivery: { out_for_delivery_at: new Date().toISOString() }
    };

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        ...timestampUpdates[status],  // Add appropriate timestamp
        tracking_number: details.trackingNumber,
        shipping_partner: details.shippingPartner,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select(`
        *,
        users!orders_user_id_fkey(
          email,
          profiles(first_name, last_name)
        )
      `)
      .single();

    if (updateError) throw updateError;

    // Log status change in history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        notes: details.notes,
        updated_by: details.updatedBy
      });

    if (historyError) throw historyError;

    return order;
  }

  static async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrderStatusHistory(orderId) {
    const { data, error } = await supabase
      .from('order_status_history')
      .select(`
        *,
        users!order_status_history_updated_by_fkey(
          email,
          profiles(first_name, last_name)
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = OrderModel;