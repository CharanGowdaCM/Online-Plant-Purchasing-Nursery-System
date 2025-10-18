const OrderModel = require('../models/orderModel');
const CartModel = require('../models/cartModel');
const { validateOrderCreate } = require('../utils/validators/orderValidator');
const { sendOrderConfirmation } = require('../utils/notifications');
const AuthModel = require('../models/authModel');

class OrderController {
  static async createOrder(req, res) {
    try {
      const validation = validateOrderCreate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const { type } = req.body;
      let items, totalAmount;

      if (type === 'cart') {
        const cart = await CartModel.getCart(req.user.id);
        items = cart.cart_items;
        totalAmount = items.reduce((sum, item) => 
          sum + (item.quantity * item.products.price), 0);
      } else {
        const { productId, quantity, price } = req.body;
        items = [{ product_id: productId, quantity, price }];
        totalAmount = quantity * price;
      }

      const order = await OrderModel.createOrder(req.user.id, items, {
        amount: totalAmount
      });

      if (type === 'cart') {
        await CartModel.clearCart(req.user.id);
      }

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: totalAmount
        }
      });
    } catch (error) {
      console.error('Error in createOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }
  }

  static async updateOrderPayment(req, res) {
    try {
      const { orderId } = req.params;
      const { paymentId } = req.body;

      const order = await OrderModel.updateOrderStatus(
        orderId,
        'confirmed',
        paymentId
      );

      // Get user details for email
      const user = await AuthModel.getUserById(req.user.id);

      // Send order confirmation
      await sendOrderConfirmation(order, user);

      res.json({
        success: true,
        message: 'Order confirmed and notification sent',
        data: { orderId: order.id }
      });
    } catch (error) {
      console.error('Error updating order payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order payment'
      });
    }
  }

  static async getPaymentOptions(req, res) {
    try {
      const { orderId } = req.params;
      const order = await OrderModel.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Configuration object for Razorpay frontend
      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.total_amount * 100, // Convert to paisa
        currency: "INR",
        name: "Plant Nursery",
        description: `Order #${order.order_number}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone
        },
        theme: {
          color: "#3399cc"
        }
      };

      res.json({
        success: true,
        data: options
      });
    } catch (error) {
      console.error('Error getting payment options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment options'
      });
    }
  }
}

module.exports = OrderController;