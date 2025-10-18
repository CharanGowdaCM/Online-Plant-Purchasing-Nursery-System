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

      // Validate cancellation reason
      const validation = validateCancellationReason(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      // Get order details
      const order = await OrderModel.getOrderById(orderId);
      
      // Check if order can be cancelled
      if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled in current status'
        });
      }

      // Initiate refund if payment was made
      if (order.payment_status === 'completed' && order.payment_id) {
        await razorpay.refunds.create({
          payment_id: order.payment_id,
          notes: {
            reason: reason,
            orderId: orderId
          }
        });
      }

      // Update order status
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

      // Restore inventory
      for (const item of order.order_items) {
        await InventoryModel.updateStock(
          item.product_id,
          item.quantity,
          'increase'
        );
      }

      // Send cancellation notification
      await sendOrderCancellation(updatedOrder);

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