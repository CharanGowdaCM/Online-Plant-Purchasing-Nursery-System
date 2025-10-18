const OrderModel = require('../../models/orderModel');
const { validateOrderUpdate } = require('../../utils/validators/orderValidator');
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

      // Check if order exists and can be updated
      const existingOrder = await OrderModel.getOrderById(orderId);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Validate status transition
      if (!isValidStatusTransition(existingOrder.status, status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status transition'
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

      // Send notification to customer
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
}

module.exports = OrderProcessingController;