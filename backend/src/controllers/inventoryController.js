const InventoryModel = require('../models/inventoryModel');
const { sendStockAlert } = require('../utils/notifications');

class InventoryController {
  static async getInventoryStatus(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const inventory = await InventoryModel.getInventoryStatus({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search
      });

      res.json({
        success: true,
        data: inventory.items,
        pagination: {
          total: inventory.total,
          page: parseInt(page),
          totalPages: Math.ceil(inventory.total / limit)
        }
      });
    } catch (error) {
      console.error('Error in getInventoryStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory status'
      });
    }
  }

  static async updateStock(req, res) {
    try {
      const { productId } = req.params;
      const { quantity, operation, notes } = req.body;

      await InventoryModel.updateStock(
        productId,
        quantity,
        operation,
        req.user.id,
        notes
      );

      res.json({
        success: true,
        message: 'Stock updated successfully'
      });
    } catch (error) {
      console.error('Error in updateStock:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update stock'
      });
    }
  }

  static async getLowStockItems(req, res) {
    try {
      const items = await InventoryModel.getLowStockItems();
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error in getLowStockItems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock items'
      });
    }
  }

  static async getInventoryMovements(req, res) {
    try {
      const { productId, startDate, endDate, page = 1, limit = 20 } = req.query;
      const movements = await InventoryModel.getInventoryMovements({
        productId,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: movements.items,
        pagination: {
          total: movements.total,
          page: parseInt(page),
          totalPages: Math.ceil(movements.total / limit)
        }
      });
    } catch (error) {
      console.error('Error in getInventoryMovements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory movements'
      });
    }
  }

  static async updateThresholds(req, res) {
    try {
      const { productId } = req.params;
      const { minThreshold, maxThreshold, reorderQuantity } = req.body;

      await InventoryModel.updateThresholds(
        productId,
        minThreshold,
        maxThreshold,
        reorderQuantity
      );

      res.json({
        success: true,
        message: 'Thresholds updated successfully'
      });
    } catch (error) {
      console.error('Error in updateThresholds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update thresholds'
      });
    }
  }
}

module.exports = InventoryController;