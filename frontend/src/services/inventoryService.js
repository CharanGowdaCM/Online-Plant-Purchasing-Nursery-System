/**
 * Developer: Charan Gowda C M
 * Module: Inventory Management
 * Features: inventoryService, products, categories, stock management, low stock alert, 
 * addProduct, editProduct, updateStock, updateThresholds, category management, 
 * cloudinary upload, admin operations, product tracking
 */


import api from './api';

const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

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

  // Update stock
  updateStock: async (productId, stockData) => {
    try {
      const response = await api.patch(`/admin/inventory/stock/${productId}`, stockData);
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Add product
  addProduct: async (productData) => {
    try {
      const response = await api.post('/admin/inventory/addproduct', productData);
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // Edit/Update product
  editProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/admin/inventory/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      console.error('Error editing product:', error);
      throw error;
    }
  },

  // Update product with image
  updateProduct: async (productId, productData) => {
    try {
      if (productData instanceof FormData) {
        const response = await api.patch(`/admin/inventory/products/${productId}`, productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.patch(`/admin/inventory/products/${productId}`, productData);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Update product stock
  updateStock: async (productId, stockData) => {
    try {
      const response = await api.patch(`/admin/inventory/products/${productId}/stock`, stockData);
      console.log("Update Stock Response:", response);
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