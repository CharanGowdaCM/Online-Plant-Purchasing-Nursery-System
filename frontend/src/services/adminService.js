// Developer: Charan Gowda C M
// Features: adminService, api, analytics, user management, role update, orders, 
// dashboard, error handling, async, API calls, admin utilities


import api from './api';

const adminService = {
  getUserAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/admin/system/analytics/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  getSalesAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/admin/system/analytics/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      throw error;
    }
  },

  getPlatformStats: async () => {
    try {
      const response = await api.get('/admin/superadmin/platform/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  },

  // Admin Management
  manageAdminRoles: async (roleData) => {
    try {
      const response = await api.post('/admin/system/admins/manage', roleData);
      return response.data;
    } catch (error) {
      console.error('Error managing admin roles:', error);
      throw error;
    }
  },

  // Activity Logs
  getActivityLogs: async (params = {}) => {
    try {
      const response = await api.get('/admin/superadmin/activity-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  },

  // Dashboard Analytics
  getDashboardAnalytics: async () => {
    try {
      const response = await api.get('/admin/superadmin/dashboard/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  },

  // User Management
  listAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/users/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  updateUserRole: async (userId, newRole) => {
    try {
      const response = await api.patch(`/users/admin/users/${userId}/role`, { role: newRole });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Orders Management
  getAllOrders: async (params = {}) => {
    try {
      const response = await api.get('/admin/superadmin/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },

  // Tickets Management
  getAllTickets: async (params = {}) => {
    try {
      const response = await api.get('/admin/support/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      throw error;
    }
  },

  // Products Management
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  },
};

export default adminService;