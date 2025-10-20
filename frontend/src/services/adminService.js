import api from './api';

const adminService = {
  // Analytics
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
      const response = await api.get('/admin/system/platform/stats');
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
      const response = await api.get('/admin/system/activity-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  },
};

export default adminService;