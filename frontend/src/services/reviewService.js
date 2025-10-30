/**
 * Developer: Akhilesh
 * Features: addReview, getMyReviews, getProductReviews, api integration, 
 * product feedback, user reviews, error handling
 */


import api from './api';

const reviewService = {
  // Add review for a product
  addReview: async (productId, reviewData) => {
    try {
      const response = await api.post(`/reviews/products/${productId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  // Get user's reviews
  getMyReviews: async () => {
    try {
      const response = await api.get('/reviews/my-reviews');
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // Get product reviews
  getProductReviews: async (productId) => {
    try {
      const response = await api.get(`reviews/products/${productId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      throw error;
    }
  },
};

export default reviewService;