/*
 Order Processing Controller - Handles order processing operations
 Author: M Lakshya
 Features: Update order status, Get order history, List all orders
*/

const OrderModel = require('../../models/orderModel');
const { validateOrderUpdate,  isValidStatusTransition } = require('../../utils/validators/orderValidator');
const { sendOrderStatusUpdate } = require('../../utils/notifications');

class OrderProcessingController {
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const validation = validateOrderUpdate(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const { status, notes, trackingNumber, shippingPartner } = req.body;

      const existingOrder = await OrderModel.getOrderById(orderId);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      const valid = isValidStatusTransition(existingOrder.status, status);
      if (!valid.isValid) {
        return res.status(400).json({
          success: false,
          message: valid.message
        });
      }

      const order = await OrderModel.updateOrderStatus(
        orderId,
        status,
        {
          notes,
          trackingNumber,
          shippingPartner,
          updatedBy: req.user.id,
          previousStatus: existingOrder.status
        }
      );

      await sendOrderStatusUpdate(order);

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status'
      });
    }
  }

  static async getOrderHistory(req, res) {
    try {
      const { orderId } = req.params;
      const history = await OrderModel.getOrderStatusHistory(orderId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error in getOrderHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order history'
      });
    }
  }

  static async getAllOrders(req, res) {
      try {
        const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
        const offset = (page - 1) * limit;
       
  
        const { data: orders, count } = await OrderModel.getAllOrders({
          limit: parseInt(limit),
          offset: parseInt(offset),
          status,
          dateFrom,
          dateTo
        });
        
           console.log(orders.length);

        res.json({
          success: true,
          data: orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0
          }
         
        });
      } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
      }
    }

     static async getOrderDetails(req, res) {
        try {
          const { orderId } = req.params;
          const order = await OrderModel.getOrderByIdForAdmin(orderId);
    
          if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
          }
    
          res.json({ success: true, data: order });
        } catch (error) {
          console.error('Error fetching order details:', error);
          res.status(500).json({ success: false, message: 'Failed to fetch order details' });
        }
      }
}

module.exports = OrderProcessingController;