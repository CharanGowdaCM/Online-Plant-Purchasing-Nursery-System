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
  }
};

export default profileService;