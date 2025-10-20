import api from './api';

const orderService = {
  // Update order status (admin)
  updateOrderStatus: async (orderId, statusData) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Get order history
  getOrderHistory: async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  },

  // Get all orders (admin/super admin)
  getAllOrders: async (params = {}) => {
    try {
      const response = await api.get('/admin/system/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },

  // Get order details (admin)
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/admin/system/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },
};

export default orderService;