const UserModel = require('../../models/userModel');
const OrderModel = require('../../models/orderModel');
const ProductModel = require('../../models/productModel');
const ActivityLogModel = require('../../models/activityLogModel');

class SuperAdminController {
  // User Management
  static async getUserAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await UserModel.getAnalytics(startDate, endDate);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user analytics'
      });
    }
  }

  // Sales Analytics
  static async getSalesAnalytics(req, res) {
    try {
      const { period = 'month' } = req.query;
      const analytics = await OrderModel.getSalesAnalytics(period);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sales analytics'
      });
    }
  }

  // Admin Management
  static async manageAdminRoles(req, res) {
    try {
      const { userId, role, action } = req.body;
      await UserModel.updateUserRole(userId, role, req.user.id);

      res.json({
        success: true,
        message: `Admin ${action} successful`
      });
    } catch (error) {
      console.error('Error managing admin roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to manage admin roles'
      });
    }
  }

  static async getActivityLogs(req, res) {
    try {
      const { page = 1, limit = 20, type, userId } = req.query;
      const logs = await ActivityLogModel.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        userId
      });

      res.json({
        success: true,
        data: logs.items,
        pagination: {
          total: logs.total,
          page: parseInt(page),
          totalPages: Math.ceil(logs.total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity logs'
      });
    }
  }

  // Platform Overview
  static async getPlatformStats(req, res) {
    try {
      const [
        userStats,
        orderStats,
        productStats,
        revenueStats
      ] = await Promise.all([
        UserModel.getStats(),
        OrderModel.getStats(),
        ProductModel.getStats(),
        OrderModel.getRevenueStats()
      ]);

      res.json({
        success: true,
        data: {
          users: userStats,
          orders: orderStats,
          products: productStats,
          revenue: revenueStats
        }
      });
    } catch (error) {
      console.error('Error getting platform stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get platform statistics'
      });
    }
  }

  static async getAllOrders(req, res) {
    try {
      const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
      const offset = (page - 1) * limit;

      const orders = await OrderModel.getAllOrders({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        dateFrom,
        dateTo
      });

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: orders.length
        }
      });
    } catch (error) {
      console.error('Error fetching all orders:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
  }

  // 2. Get single order details by ID
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

module.exports = SuperAdminController;