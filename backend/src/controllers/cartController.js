const CartModel = require('../models/cartModel');
const { validateCartItem } = require('../utils/validators/cartValidator');

class CartController {
  static async getCart(req, res) {
    try {
      const cart = await CartModel.getCart(req.user.id);
      
      // Validate stock levels for all items
      const invalidItems = await CartModel.validateCartItems(req.user.id);
      
      // Calculate totals
      const cartItems = cart?.cart_items || [];
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (item.quantity * item.products.price), 0);

      res.json({
        success: true,
        data: {
          items: cartItems,
          totalItems,
          totalAmount,
          invalidItems: invalidItems.length > 0 ? invalidItems : undefined
        }
      });
    } catch (error) {
      console.error('Error in getCart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cart'
      });
    }
  }

  static async addToCart(req, res) {
    try {
      const validation = validateCartItem(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const { productId, quantity } = req.body;
      await CartModel.addToCart(req.user.id, productId, quantity);

      res.json({
        success: true,
        message: 'Item added to cart'
      });
    } catch (error) {
      console.error('Error in addToCart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart'
      });
    }
  }

  static async updateCartItem(req, res) {
    try {
      const { cartItemId } = req.params;
      const { quantity } = req.body;

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity'
        });
      }

      await CartModel.updateCartItem(cartItemId, quantity);

      res.json({
        success: true,
        message: 'Cart item updated'
      });
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item'
      });
    }
  }

  static async removeFromCart(req, res) {
    try {
      const { cartItemId } = req.params;
      await CartModel.removeFromCart(cartItemId);

      res.json({
        success: true,
        message: 'Item removed from cart'
      });
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart'
      });
    }
  }

  static async clearCart(req, res) {
    try {
      await CartModel.clearCart(req.user.id);

      res.json({
        success: true,
        message: 'Cart cleared'
      });
    } catch (error) {
      console.error('Error in clearCart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart'
      });
    }
  }
}

module.exports = CartController;