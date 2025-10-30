/**
 * Developer: Akhilesh
 * Features: getAllTickets, updateTicketStatus, getTicketDetails, 
 * support management, admin support, ticket handling, api integration
 */


import api from './api';

const supportService = {
  getAllTickets: async (params = {}) => {
    try {
      const response = await api.get('/admin/support/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  updateTicketStatus: async (ticketId, statusData) => {
    try {
      const response = await api.put(`/admin/support/${ticketId}`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },



  // Get single ticket details
  getTicketDetails: async (ticketId) => {
    try {
      const response = await api.get(`/admin/support/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  }
};

export default supportService;