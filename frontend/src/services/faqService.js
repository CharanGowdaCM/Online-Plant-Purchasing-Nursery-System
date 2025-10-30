/**
 * Developer: K Akhilesh
 * Module: Customer Support - FAQ Management
 * Features: FAQs, Categories, Admin Control, Public Access, Support, Helpdesk
 */


import api from './api';

const faqService = {

 // Fetch all publicly available FAQs (visible to customers) 
  getPublicFAQs: async (params = {}) => {
    try {
      const response = await api.get('/faqs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching public FAQs:', error);
      throw error;
    }
  },

// Retrieve list of FAQ categories for filtering and organization
  getFAQCategories: async () => {
    try {
      const response = await api.get('/faqs/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      throw error;
    }
  },

   // Get detailed information about a specific FAQ by its ID
  getFAQById: async (faqId) => {
    try {
      const response = await api.get(`/faqs/${faqId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  },



   // Admin: Fetch all FAQs with pagination and filters
  getAllFAQs: async (params = {}) => {
    try {
      const response = await api.get('/admin/faqs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all FAQs:', error);
      throw error;
    }
  },

    // Admin: Create a new FAQ entry
  createFAQ: async (faqData) => {
    try {
      const response = await api.post('/admin/faqs', faqData);
      return response.data;
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  },

  // Admin: Update details of an existing FAQ
  updateFAQ: async (faqId, updates) => {
    try {
      const response = await api.put(`/admin/faqs/${faqId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  },

 // Admin: Delete an FAQ 
  deleteFAQ: async (faqId, hardDelete = false) => {
    try {
      const response = await api.delete(`/admin/faqs/${faqId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  },

// Admin: Reorder FAQs based on priority or display order
  reorderFAQs: async (orderUpdates) => {
    try {
      const response = await api.post('/admin/faqs/reorder', {
        order_updates: orderUpdates
      });
      return response.data;
    } catch (error) {
      console.error('Error reordering FAQs:', error);
      throw error;
    }
  }
};

export default faqService;
