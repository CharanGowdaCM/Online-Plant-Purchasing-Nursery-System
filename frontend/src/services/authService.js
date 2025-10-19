import api from './api';

const authService = {
  // Send OTP for signup
  sendSignupOTP: async (email) => {
    const response = await api.post('/auth/signup/send-otp', { email });
    return response.data;
  },

  // Verify OTP and complete signup
  verifySignupOTP: async (email, otp, password) => {
    try {
      // Step 1: Verify OTP and create account
      const verifyResponse = await api.post('/auth/signup/verify', { 
        email, 
        otp, 
        password 
      });

      if (!verifyResponse.data.success) {
        throw new Error(verifyResponse.data.message || 'OTP verification failed');
      }

      // Return the user data - don't auto-login yet
      return {
        success: true,
        user: verifyResponse.data.user,
        message: verifyResponse.data.message
      };

      if (loginResponse.data.success) {
        const user = loginResponse.data.user;
        // Store tokens and user info
        localStorage.setItem('accessToken', loginResponse.data.accessToken);
        localStorage.setItem('refreshToken', loginResponse.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Return success with hasProfile flag
        return {
          success: true,
          user,
          hasProfile: !!user.profile,
          loginSuccess: true
        };
      }

      throw new Error('Auto-login failed after signup');
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Signup failed'
      };
    }
  },

  // Login - returns tokens directly
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh', { refreshToken });
    if (response.data.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      newPassword,
      confirmPassword 
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      // Send logout request with refresh token to invalidate it on server
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local cleanup even if server request fails
    } finally {
      // Clear all auth-related data from local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // Clear any other auth-related data
      localStorage.removeItem('lastLoginTime');
      localStorage.removeItem('rememberMe');
    }
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

export default authService;