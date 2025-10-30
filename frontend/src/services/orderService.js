/**
 * Developer: M Lakshya
 * Module: Order Processing
 * Features: orderService, updateOrderStatus, getOrderHistory, getAllOrders, getOrderDetails,
 * order tracking, order management, admin operations, shipping updates, order status control
 */


import api from './api';

const orderService = {
  // Update order status 
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

  // Get all orders 
  getAllOrders: async (params = {}) => {
    try {
      const response = await api.get('/admin/orders/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },

  // Get order details 
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },
};

export default orderService;