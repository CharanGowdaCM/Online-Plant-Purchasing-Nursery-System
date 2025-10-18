const supabase = require('../config/supabase');

class InventoryModel {
  static async checkStock(productId, requestedQuantity) {
    const { data: product, error } = await supabase
      .from('products')
      .select('stock_quantity, min_stock_threshold')
      .eq('id', productId)
      .single();

    if (error) throw error;
    if (!product) return { available: false, message: 'Product not found' };

    return {
      available: product.stock_quantity >= requestedQuantity,
      currentStock: product.stock_quantity,
      message: product.stock_quantity < requestedQuantity ? 
        `Only ${product.stock_quantity} units available` : null
    };
  }

  static async updateStock(productId, quantity, operation = 'decrease') {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = operation === 'decrease' ? 
      product.stock_quantity - quantity : 
      product.stock_quantity + quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) throw updateError;

    // Log inventory movement
    await this.logInventoryMovement(productId, quantity, operation);
  }

  static async logInventoryMovement(productId, quantity, operation) {
    const { error } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: productId,
        quantity,
        movement_type: operation,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async getInventoryStatus({ page, limit, status, search }) {
    let query = supabase
      .from('product_inventory_status')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('stock_status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .order('stock_quantity', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      items: data,
      total: count
    };
  }

  static async getLowStockItems() {
    const { data, error } = await supabase
      .from('product_inventory_status')
      .select('*')
      .eq('stock_status', 'LOW');

    if (error) throw error;
    return data;
  }

  static async getInventoryMovements({ productId, startDate, endDate, page, limit }) {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        products(name),
        users(email)
      `, { count: 'exact' });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      items: data,
      total: count
    };
  }

  static async updateThresholds(productId, minThreshold, maxThreshold, reorderQuantity) {
    const { error } = await supabase
      .from('products')
      .update({
        min_stock_threshold: minThreshold,
        max_stock_threshold: maxThreshold,
        reorder_quantity: reorderQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) throw error;
  }

  static async checkAndNotifyLowStock(productId) {
    const { data: product, error } = await supabase
      .from('product_inventory_status')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;

    if (product.stock_status === 'LOW') {
      // Send notification to inventory admin
      await sendStockAlert(product);
    }
  }
}

module.exports = InventoryModel;