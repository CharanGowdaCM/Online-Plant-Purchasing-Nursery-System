/*
 Order Model - Handles Order management and processing
 Author: Lakshya M
 Features: Create, Update, Retrieve Orders and Order Status
*/

const supabase = require('../config/supabase');
const { generateTrackingId } = require('../utils/trackingGenerator');
const InventoryModel = require('./inventoryModel');

class OrderModel {
  static async createOrder({ userId, items, address, amount, type, paymentDetails = {} }) {
  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('[createOrder] No items provided');
      throw new Error('No items provided for order');
    }
    if (!userId) {
      console.error('[createOrder] Invalid userId:', userId);
      throw new Error('Invalid userId');
    }

    items = items.map(it => ({
      product_id: it.product_id ?? it.id,
      quantity: Number(it.quantity ?? 0),
      price: Number(it.price ?? it.unit_price ?? it.product?.price ?? 0),
      raw: it
    }));

    //console.log('createOrder:', items);

    // VALIDATION PHASE - Must complete successfully before creating order
    for (const item of items) {
      const quantity = Number(item.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        const error = new Error(`Invalid quantity for product ${item.product_id}`);
        console.error('[createOrder] Validation failed:', error.message);
        throw error;
      }

      // Fetch product details including max_order_quantity
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, max_order_quantity')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        const error = new Error(`Product not found: ${item.product_id}`);
        console.error('[createOrder] Validation failed:', error.message);
        throw error;
      }

      // Check max order quantity limit
      if (product.max_order_quantity && quantity > product.max_order_quantity) {
        const error = new Error(`Maximum order quantity is ${product.max_order_quantity} for ${product.name}. You tried to order ${quantity}.`);
        console.error('[createOrder] Validation failed:', error.message);
        throw error;
      }

      // Check stock availability
      const stockRes = await InventoryModel.checkStock(item.product_id, quantity);

      if (stockRes && typeof stockRes === 'object') {
        if (stockRes.available === false) {
          const error = new Error(`Insufficient stock for ${product.name}: ${stockRes.message ?? 'not available'}`);
          console.error('[createOrder] Validation failed:', error.message);
          throw error;
        }
      }
    }
    
    console.log('[createOrder] All validations passed, proceeding with order creation');
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price ?? 0);
      const qty = Number(item.quantity ?? 0);
      return sum + (price * qty);
    }, 0);

    const tax_amount = Number(paymentDetails.tax_amount ?? 0);
    const shipping_cost = Number(paymentDetails.shipping_cost ?? 0);
    const discount_amount = Number(paymentDetails.discount_amount ?? 0);
    const total_amount = Number((amount ?? (subtotal + tax_amount + shipping_cost - discount_amount)).toFixed(2));

    const shipping_address = (address && typeof address === 'object') ? address : {
      name: 'N/A', address_line: 'N/A', city: 'N/A', state: 'N/A', zip: '000000'
    };
    const billing_address = (paymentDetails.billing_address && typeof paymentDetails.billing_address === 'object')
      ? paymentDetails.billing_address : shipping_address;

    const customer_email = paymentDetails.customer_email ?? 'noemail@example.com';
    const customer_phone = paymentDetails.customer_phone ?? '0000000000';

   

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: `ORD${Date.now()}`,
        user_id: userId,
        status: 'pending',
        payment_status: paymentDetails.payment_status ?? 'pending',
        subtotal: Number(subtotal.toFixed(2)),
        tax_amount: Number(tax_amount.toFixed(2)),
        shipping_cost: Number(shipping_cost.toFixed(2)),
        discount_amount: Number(discount_amount.toFixed(2)),
        total_amount: Number(total_amount.toFixed(2)),
        shipping_address,
        billing_address,
        customer_email,
        customer_phone,
        customer_notes: paymentDetails.customer_notes ?? null,
        tracking_number: generateTrackingId()
      }])
      .select()
      .single();

    if (orderError) {
      console.error('[createOrder] Orders table insert failed', orderError);
      throw orderError;
    }

    try {
      // Build order items
      const orderItems = [];
      for (const item of items) {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('name, sku')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('[createOrder] failed to fetch product data for', item.product_id, productError);
          throw productError;
        }

        orderItems.push({
          order_id: order.id,
          product_id: item.product_id,
          product_name: productData?.name ?? 'Unknown Product',
          product_sku: productData?.sku ?? 'SKU-UNKNOWN',
          quantity: item.quantity,
          unit_price: Number(item.price ?? 0),
          subtotal: Number((item.quantity * (item.price ?? 0)).toFixed(2))
        });
      }

      // Insert order items
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error('[createOrder] order_items insert failed', itemsError);
        throw itemsError;
      }

      // Update inventory
      for (const item of items) {
        const productId = item.product_id;
        await InventoryModel.updateStock(productId, Number(item.quantity ?? 0), 'decrease');
        await InventoryModel.checkAndNotifyLowStock(productId);
      }

      // Create status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Order placed successfully',
          updated_by: userId,
        });

      if (historyError) {
        console.error('[createOrder] history insert failed', historyError);
        throw historyError;
      }

      return order;
    } catch (postOrderError) {
      // Rollback: Delete the order if any subsequent operation fails
      console.error('[createOrder] Error after order creation, rolling back order:', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      throw postOrderError;
    }
  } catch (err) {
    console.error('[createOrder] caught error:', err);
    throw err;
  }
}


  static async updateOrderStatus(orderId, status, details = {}) {
    const timestampMap = {
      confirmed: { confirmed_at: new Date().toISOString() },
      shipped: { shipped_at: new Date().toISOString() },
      out_for_delivery: { shipped_at: new Date().toISOString() },
      delivered: { delivered_at: new Date().toISOString() },
      cancelled: { cancelled_at: new Date().toISOString() }
    };

    const updatePayload = {
      status,
      shipping_partner: details.shippingPartner || null,
      updated_at: new Date().toISOString(),
      ... (timestampMap[status] || {})
    };

    if (details.paymentId || status === 'confirmed') {
      updatePayload.payment_status = 'paid';
    }
   
    const { data: order, error: updateError } = await supabase
  .from('orders')
  .update(updatePayload)
  .eq('id', orderId)
  .select(`
    *,
    order_items (
      id,
      product_id,
      quantity,
      unit_price,
      subtotal,
      products (
        id,
        name,
        product_images (
          image_url,
          is_primary
        )
      )
    ),
    users (
      profiles (
        first_name,
        last_name
      )
    )
  `)
  .single();
   
    if (updateError) throw updateError;

    const historyPayload = {
      order_id: orderId,
      status,
      notes: details.notes || null,
      updated_by: details.updatedBy || null,
    };

    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert(historyPayload);

    if (historyError) throw historyError;
    console.log('done2');
    console.log(order);
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
        unit_price,
        subtotal,
        products (
          id,
          name,
          description,
          product_images (
            image_url,
            is_primary
          )
        )
      )
    `)
    .eq('id', orderId)
    .maybeSingle(); 

  if (!data) {
    return null;
  }

  data.order_items = (data.order_items || []).map(item => {
    const product = item.products || null;
    const primaryImage = (product?.product_images || []).find(img => img.is_primary) || null;

    return {
      ...item,
      price: item.unit_price,
      product: {
        ...(product || {}),
        image_url: primaryImage ? primaryImage.image_url : (product?.product_images?.[0]?.image_url ?? null)
      }
    };
  });

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
        unit_price,
        subtotal,
        products (
          id,
          name,
          description,
          product_images (
            image_url
          )
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
      `, { count: 'exact' }) 
      .order('placed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('placed_at', dateFrom);
    if (dateTo) query = query.lte('placed_at', dateTo);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }


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

  static async getStats() {
    try {
      const { count: totalOrders, error: totalError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      if (totalError) throw totalError;

      const statuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
      const ordersByStatus = {};

      for (const status of statuses) {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        if (error) throw error;
        ordersByStatus[status] = count;
      }

      return {
        totalOrders,
        ordersByStatus
      };
    } catch (err) {
      throw new Error(err.message || 'Failed to get order stats');
    }
  }

  static async getRevenueStats({ dateFrom, dateTo } = {}) {
    try {
      let query = supabase
        .from('orders')
        .select('total_amount', { count: 'exact', head: false })
        .eq('payment_status', 'paid'); 

      if (dateFrom) query = query.gte('placed_at', dateFrom);
      if (dateTo) query = query.lte('placed_at', dateTo);

      const { data, error } = await query;
      if (error) throw error;

      const totalRevenue = data.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalOrders = data.length;
      const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
      const maxOrderValue = data.length ? Math.max(...data.map(o => Number(o.total_amount))) : 0;
      const minOrderValue = data.length ? Math.min(...data.map(o => Number(o.total_amount))) : 0;

      return {
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        maxOrderValue: Number(maxOrderValue.toFixed(2)),
        minOrderValue: Number(minOrderValue.toFixed(2))
      };
    } catch (err) {
      throw new Error(err.message || 'Failed to get revenue stats');
    }
  }

}


  

module.exports = OrderModel;
