/**
 * Developer: Akhilesh
 * Features: updateProfile, getProfile, getAdminProfile, updateDeliveryAddresses, 
 * updatePreferences, requestEmailChange, verifyEmailOTP, api integration, error handling
 */


import api from './api';

const profileService = {
  // Create or update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.post('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  getAdminProfile: async (user_id) => {
    try {
      const response = await api.get(`/users/admin/users/${user_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  

  // Update delivery addresses
  updateDeliveryAddresses: async (addresses) => {
    try {
      const response = await api.put('/users/profile/addresses', { addresses });
      return response.data;
    } catch (error) {
      console.error('Error updating addresses:', error);
      throw error;
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/users/profile/preferences', { preferences });
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  // Request email change - sends OTP to new email
  requestEmailChange: async (newEmail) => {
    try {
      const response = await api.post('/users/request-email-change', { newEmail });
      return response.data;
    } catch (error) {
      console.error('Error requesting email change:', error);
      throw error;
    }
  },

  // Verify OTP for email change
  verifyEmailOTP: async (newEmail, otp) => {
    try {
      const response = await api.post('/users/verify-email-otp', { newEmail, otp });
      return response.data;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      throw error;
    }
  }
};

export default profileService;