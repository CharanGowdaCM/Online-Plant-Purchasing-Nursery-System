/**
 * Developer: Akhilesh
 * Features: createTicket, getMyTickets, getTicketDetails, 
 * user support, ticket creation, ticket tracking, api integration
 */


import api from './api';

const ticketService = {
  // Create support ticket
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('users/support', ticketData);
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Get user's tickets
  getMyTickets: async () => {
    try {
      const response = await api.get('users/support/my-tickets');
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  // Get ticket details
  getTicketDetails: async (ticketId) => {
    try {
      const response = await api.get(`users/support/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  },

  
};

export default ticketService;