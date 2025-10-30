// Developer: M Lakshya
// Features: CartService, api, getCart, addToCart, updateCartItem, removeFromCart, 
// clearCart, async, API requests, error handling, cart operations, 
// productId, quantity, RESTful endpoints

import api from './api';

class CartService {
  // Fetch user's cart
  static async getCart() {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Add item to cart
  static async addToCart(productId, quantity) {
    try {
      const response = await api.post('/cart/items', { productId, quantity });
      // Dispatch custom event to update cart badge
      window.dispatchEvent(new Event('cartUpdated'));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update cart item quantity
  static async updateCartItem(cartItemId, quantity) {
    try {
      const response = await api.patch(`/cart/items/${cartItemId}`, { quantity });
      // Dispatch custom event to update cart badge
      window.dispatchEvent(new Event('cartUpdated'));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Remove item from cart
  static async removeFromCart(cartItemId) {
    try {
      const response = await api.delete(`/cart/items/${cartItemId}`);
      // Dispatch custom event to update cart badge
      window.dispatchEvent(new Event('cartUpdated'));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Clear entire cart
  static async clearCart() {
    try {
      const response = await api.delete('/cart');
      // Dispatch custom event to update cart badge
      window.dispatchEvent(new Event('cartUpdated'));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default CartService;