/*
 cart model - handles cart operations
 Author: Lakshya M
 Features: Get cart, add to cart, update cart item, remove from cart, clear cart
*/

const supabase = require('../config/supabase');
const InventoryModel = require('./inventoryModel');

class CartModel {
  static async getCart(userId) {
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        id,
        cart_items:cart_items(
          id,
          product_id,
          quantity,
          products:products(
            id,
            name,
            price,
            stock_quantity,
            product_images!inner(
              id,
              image_url,
              alt_text,
              is_primary
            )
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (cartError) throw cartError;

    // 🧠 Simplify product images — keep only the primary image if available
    if (cart?.cart_items) {
      for (const item of cart.cart_items) {
        const images = item.products?.product_images || [];
        const primaryImage =
          images.find((img) => img.is_primary) || images[0] || null;

        item.products.image_url = primaryImage ? primaryImage.image_url : null;
        item.products.alt_text = primaryImage ? primaryImage.alt_text : null;

        // Optional: remove nested product_images array
        delete item.products.product_images;
      }
    }

    return cart;
  }

  static async addToCart(userId, productId, quantity) {
  // Check stock availability
  const stockCheck = await InventoryModel.checkStock(productId, quantity);
  if (!stockCheck.available) {
    throw new Error(stockCheck.message || 'Insufficient stock');
  }

  // Get or create cart
  const { data: existingCart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  let cartId;
  if (!existingCart) {
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (createError) throw createError;
    cartId = newCart.id;
  } else {
    cartId = existingCart.id;
  }

  // Fetch current product price
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  // Check existing cart item
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existingItem) {
    // Update quantity and price
    const newQuantity = existingItem.quantity + quantity;
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({
        quantity: newQuantity,
        unit_price: product.price
      })
      .eq('id', existingItem.id);

    if (updateError) throw updateError;
  } else {
    // Add new item with price
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity,
        unit_price: product.price
      });

    if (insertError) throw insertError;
  }
}


  static async validateCartItems(userId) {
    const cart = await this.getCart(userId);
    const invalidItems = [];

    for (const item of cart?.cart_items || []) {
      const stockCheck = await InventoryModel.checkStock(
        item.product_id,
        item.quantity
      );

      if (!stockCheck.available) {
        invalidItems.push({
          cartItemId: item.id,
          productName: item.products.name,
          requestedQuantity: item.quantity,
          availableQuantity: stockCheck.currentStock,
        });
      }
    }

    return invalidItems;
  }

  static async updateCartItem(cartItemId, quantity) {
    // Get product info first
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('id', cartItemId)
      .single();

    if (fetchError) throw fetchError;

    // Check stock availability
    const stockCheck = await InventoryModel.checkStock(
      cartItem.product_id,
      quantity
    );

    if (!stockCheck.available) {
      throw new Error(stockCheck.message || 'Insufficient stock');
    }

    // Proceed with update if stock is available
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (error) throw error;
  }

  static async removeFromCart(cartItemId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  }

  static async clearCart(userId) {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cart) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;
    }
  }
}

module.exports = CartModel;
