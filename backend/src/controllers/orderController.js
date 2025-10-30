/*
 Order Controller - Handles Order management 
 Author: M Lakshya
 Features: Create order, Update payment, Get user orders
*/

const OrderModel = require('../models/orderModel');
const CartModel = require('../models/cartModel');
const { validateOrderCreate } = require('../utils/validators/orderValidator');
const { sendOrderConfirmation } = require('../utils/notifications');
const UserModel = require('../models/userModel');
const { recordActivity } = require('../utils/activityRecorder.js');

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
    let items = [];
    let totalAmount = 0;
    let address = req.body.address ?? null;
    const userId = req.user.id;
    
    if (type === 'cart') {
      const cart = await CartModel.getCart(userId);

      items = (cart.cart_items || []).map(ci => ({
        product_id: ci.product_id ?? ci.id ?? ci.product?.id,
        quantity: Number(ci.quantity ?? ci.qty ?? 0),
        price: Number(ci.products?.price ?? ci.price ?? ci.product?.price ?? 0)
      }));

      totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      totalAmount = totalAmount+req.body.paymentDetails.tax_amount; 
    } else {
      const { productId, quantity, price } = req.body;
      items = [{ product_id: productId, quantity: Number(quantity), price: Number(price) }];
      totalAmount = Number(quantity) * Number(price);
    }

   // console.log(req.body.paymentDetails);
    const order = await OrderModel.createOrder({
      userId,
      items,
      address,
      amount: totalAmount,
      type,
      paymentDetails: req.body.paymentDetails ?? {}
    });

    recordActivity(req, 'CREATE', 'Order', order.id, {
      totalAmount,
      itemCount: items.length,
      type
    });
   
    res.status(201).json({
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
      message: typeof error === 'string' ? error : (error.message || 'Failed to create order')
    });
  }
}


  static async updateOrderPayment(req, res) {
    try {
      const { orderId } = req.params;
      const { paymentId } = req.body;
      const { type } = req.body;
      
      const order = await OrderModel.updateOrderStatus(
        orderId,
        'confirmed',
        [paymentId]
      );

      const user = await UserModel.getUserDetailsById(req.user.id);
      //console.log(user);
      await sendOrderConfirmation(order, user);

      if (type === 'cart') {
        await CartModel.clearCart(userId);
      }

      recordActivity(req, 'UPDATE', 'Order', orderId, {
        status: 'confirmed',
        paymentId,
        
      });

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

      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.total_amount * 100, 
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

  static async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const orders = await OrderModel.getOrdersByUserId(userId);

      return res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user orders'
      });
    }
  }

  static async getUserOrderDetails(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      console.log("Fetching order details for Order ID:", orderId, "and User ID:", userId);
     const order = await OrderModel.getOrderById(orderId);
     console.log("Fetched Order:", order);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const history = await OrderModel.getOrderStatusHistory(orderId);

      return res.json({
        success: true,
        data: {
          ...order,
          status_history: history
        }
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order details'
      });
    }
  }
}

module.exports = OrderController;