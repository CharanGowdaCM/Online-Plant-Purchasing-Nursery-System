import api from './api';

const inventoryService = {
  // Get inventory status with filters
  getInventoryStatus: async (params = {}) => {
    try {
      const response = await api.get('/admin/inventory/status', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory status:', error);
      throw error;
    }
  },

  // Get low stock items
  getLowStockItems: async () => {
    try {
      const response = await api.get('/admin/inventory/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get inventory movements
  getInventoryMovements: async (params = {}) => {
    try {
      const response = await api.get('/admin/inventory/movements', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
      throw error;
    }
  },

  // Add new product
  addProduct: async (productData) => {
    try {
      const response = await api.post('/admin/inventory/addproduct', productData);
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // Update product stock
  updateStock: async (productId, stockData) => {
    try {
      const response = await api.patch(`/admin/inventory/products/${productId}/stock`, stockData);
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Update stock thresholds
  updateThresholds: async (productId, thresholds) => {
    try {
      const response = await api.patch(`/admin/inventory/products/${productId}/thresholds`, thresholds);
      return response.data;
    } catch (error) {
      console.error('Error updating thresholds:', error);
      throw error;
    }
  },

  // Category management
  addCategory: async (categoryData) => {
    try {
      const response = await api.post('/admin/inventory/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  listCategories: async () => {
    try {
      const response = await api.get('/admin/inventory/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.patch(`/admin/inventory/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/admin/inventory/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};

export default inventoryService;