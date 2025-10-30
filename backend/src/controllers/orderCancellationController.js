/*
 Order cancellation Controller - Cancels orders
 Author: M Lakshya
 Features: Cancel an order, update inventory
*/

const OrderModel = require('../models/orderModel');
const InventoryModel = require('../models/inventoryModel');
const razorpay = require('../config/razorpay');
const { validateCancellationReason } = require('../utils/validators/orderValidator');
const { sendOrderCancellation } = require('../utils/notifications');

class OrderCancellationController {
  static async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason, comments } = req.body;

      const validation = validateCancellationReason(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const order = await OrderModel.getOrderById(orderId);
      
      if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled in current status'
        });
      }

      if (order.payment_status === 'completed' && order.payment_id) {
        await razorpay.refunds.create({
          payment_id: order.payment_id,
          notes: {
            reason: reason,
            orderId: orderId
          }
        });
      }

      const updatedOrder = await OrderModel.updateOrderStatus(
        orderId,
        'cancelled',
        {
          notes: `Cancelled: ${reason}${comments ? ` - ${comments}` : ''}`,
          updatedBy: req.user.id,
          cancellation_reason: reason,
          cancellation_comments: comments
        }
      );

      for (const item of order.order_items) {
        await InventoryModel.updateStock(
          item.product_id,
          item.quantity,
          'increase'
        );
      }
      await sendOrderCancellation(updatedOrder,reason,comments);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder
      });
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order'
      });
    }
  }
}

module.exports = OrderCancellationController;