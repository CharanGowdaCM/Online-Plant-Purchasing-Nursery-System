const supabase = require('../config/supabase');
const { generateTrackingId } = require('../utils/trackingGenerator');
const InventoryModel = require('./inventoryModel');


class OrderModel {
  static async createOrder(userId, items, paymentDetails = {}) {
  const trackingId = generateTrackingId();

  // Step 1: Check stock for each item
  for (const item of items) {
    const { available, message } = await InventoryModel.checkStock(item.product_id, item.quantity);
    if (!available) throw new Error(`Insufficient stock for product ${item.product_id}: ${message}`);
  }

  // Step 2: Compute totals
  const subtotal = items.reduce((s, it) => s + (Number(it.price) * Number(it.quantity)), 0);
  const tax_amount = Number(paymentDetails.tax_amount || 0);
  const shipping_cost = Number(paymentDetails.shipping_cost || 0);
  const discount_amount = Number(paymentDetails.discount_amount || 0);
  const total_amount = Number(paymentDetails.total_amount || (subtotal + tax_amount + shipping_cost - discount_amount).toFixed(2));

  // Step 3: Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      order_number: `ORD${Date.now()}`,
      user_id: userId,
      status: 'pending',
      payment_status: paymentDetails.payment_status || 'pending',
      subtotal,
      tax_amount,
      shipping_cost,
      discount_amount,
      total_amount,
      shipping_address: paymentDetails.shipping_address || {},
      billing_address: paymentDetails.billing_address || {},
      customer_email: paymentDetails.customer_email || null,
      customer_phone: paymentDetails.customer_phone || null,
      customer_notes: paymentDetails.customer_notes || null,
      tracking_number: trackingId,
      placed_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (orderError) throw orderError;

  // Step 4: Insert order items
  const orderItems = items.map(it => ({
    order_id: order.id,
    product_id: it.product_id,
    quantity: it.quantity,
    price: it.price
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  // Step 5: Decrease stock for each product
  for (const item of items) {
    await InventoryModel.updateStock(item.product_id, item.quantity, 'decrease');
    await InventoryModel.checkAndNotifyLowStock(item.product_id);
  }

  // Step 6: Log order status history
  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({
      order_id: order.id,
      status: 'pending',
      notes: 'Order placed successfully',
      tracking_number: trackingId,
      updated_by: userId
    });
  if (historyError) throw historyError;

  return order;
}


  static async updateOrderStatus(orderId, status, details = {}) {
    // map status -> timestamp field in your orders table
    const timestampMap = {
      confirmed: { confirmed_at: new Date().toISOString() },
      shipped: { shipped_at: new Date().toISOString() },
      out_for_delivery: { shipped_at: new Date().toISOString() },
      delivered: { delivered_at: new Date().toISOString() },
      cancelled: { cancelled_at: new Date().toISOString() }
    };

    const updatePayload = {
      status,
      tracking_number: details.trackingNumber || null,
      shipping_partner: details.shippingPartner || null,
      updated_at: new Date().toISOString(),
      ... (timestampMap[status] || {})
    };

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
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
      .single();

    if (updateError) throw updateError;

    // insert in history
    const historyPayload = {
      order_id: orderId,
      status,
      notes: details.notes || null,
      updated_by: details.updatedBy || null,
      tracking_number: details.trackingNumber || null,
      shipping_partner: details.shippingPartner || null
    };

    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert(historyPayload);

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
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            image_url,
            description
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrdersByUserId(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal,
        tax_amount,
        shipping_cost,
        discount_amount,
        total_amount,
        shipping_address,
        billing_address,
        customer_email,
        customer_phone,
        customer_notes,
        admin_notes,
        tracking_number,
        shipping_partner,
        placed_at,
        confirmed_at,
        shipped_at,
        delivered_at,
        cancelled_at,
        created_at,
        updated_at,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            image_url,
            description
          )
        )
      `)
      .eq('user_id', userId)
      .order('placed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getOrderStatusHistory(orderId) {
    const { data, error } = await supabase
      .from('order_status_history')
      .select(`
        *,
        users!order_status_history_updated_by_fkey (
          id,
          email
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAllOrders({ limit = 50, offset = 0, status, dateFrom, dateTo }) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        ),
        order_status_history (
          id,
          status,
          notes,
          location,
          updated_by,
          created_at
        ),
        users!orders_user_id_fkey (
          email,
          profiles(first_name, last_name)
        )
      `)
      .order('placed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('placed_at', dateFrom);
    if (dateTo) query = query.lte('placed_at', dateTo);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get a single order by ID (with full details)
  static async getOrderByIdForAdmin(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        ),
        order_status_history (
          id,
          status,
          notes,
          location,
          updated_by,
          created_at,
          users!order_status_history_updated_by_fkey(
            email,
            profiles(first_name, last_name)
          )
        ),
        users!orders_user_id_fkey (
          email,
          profiles(first_name, last_name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = OrderModel;
