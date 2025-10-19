const InventoryModel = require('../../models/inventoryModel');
const ProductModel = require('../../models/productModel');
const CategoryModel = require('../../models/categoryModel');
const { validateCategoryPayload } = require('../../utils/validators/categoryValidator');
const { sendStockAlert } = require('../../utils/notifications');

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

  static async addProduct(req, res) {
    try {
      const role = req.user && req.user.role;
      if (!role || (role !== 'inventory_admin' && role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const productData = req.body;

      // Basic validation (should eventually move to middleware)
      const requiredFields = ['sku', 'name', 'category_id', 'price'];
      const missing = requiredFields.filter((f) => !productData[f]);
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missing.join(', ')}`,
        });
      }

      // Create product via ProductModel
      const product = await ProductModel.createProduct(productData);

      // Log inventory movement if stock > 0
      if (product.stock_quantity > 0) {
        await InventoryModel.logInventoryMovement(product.id, product.stock_quantity, 'increase');
        await InventoryModel.checkAndNotifyLowStock(product.id);
      }

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (err) {
      console.error('Error in addProduct:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Server error while creating product',
      });
    }
  }

  static async addCategory(req, res) {
    try {
      const validation = validateCategoryPayload(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, errors: validation.errors });
      }

      const category = await CategoryModel.addCategory(req.body);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({ success: false, message: 'Failed to create category' });
    }
  }

  static async listCategories(req, res) {
    try {
      const { includeInactive } = req.query;
      const categories = await CategoryModel.getAllCategories({ includeInactive: includeInactive === 'true' });
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Error listing categories:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  }

  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.updateCategory(id, req.body);
      res.json({ success: true, message: 'Category updated successfully', data: category });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Failed to update category' });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await CategoryModel.deleteCategory(id);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
  }

}

module.exports = InventoryController;