import api from './api';

const supportService = {
  // Get all tickets (admin)
  getAllTickets: async (params = {}) => {
    try {
      const response = await api.get('/admin/support/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, statusData) => {
    try {
      const response = await api.put(`/admin/support/${ticketId}`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },
};

export default supportService;