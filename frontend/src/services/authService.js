// Developer: K Akhilesh
// Features: authService, api, signup, OTP verification, login, token refresh, 
// forgot password, reset password, logout, user session, localStorage, 
// authentication, accessToken, refreshToken, getCurrentUser, isAuthenticated

import api from './api';

const authService = {
  // Send OTP for signup
  sendSignupOTP: async (email, password) => {
    const response = await api.post('/auth/signup/send-otp', { email, password });
    console.log('Signup OTP response:', response.data);
    return response.data;
  },

  // Verify OTP and complete signup
  verifySignupOTP: async (email, otp, password) => {
    try {
      const verifyResponse = await api.post('/auth/signup/verify', { 
        email,
        otp,
        password
      });

      if (!verifyResponse.data.success) {
        throw new Error(verifyResponse.data.message || 'OTP verification failed');
      }

      if (verifyResponse.data.success) {
        const user = verifyResponse.data.user;
        localStorage.setItem('accessToken', verifyResponse.data.accessToken);
        localStorage.setItem('refreshToken', verifyResponse.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
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
      const message = error?.response?.data?.message || error?.message || 'Signup failed';
      return {
        success: false,
        message
      };
    }

    // return {
    //     success: true,
    //     user: verifyResponse.data.user,
    //     message: verifyResponse.data.message
    //   };
  },

  // Login 
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response:', response.data);
    if (response.data.success) {
      const currentLoginTime = new Date().toISOString();
      console.log('Current login time:', currentLoginTime);
      
      const previousLoginTime = response.data.user.previousLoginTime || null;
      console.log('Previous login time from backend:', previousLoginTime);
      
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Store user with lastLoginTime
      const userWithLoginTime = {
        ...response.data.user,
        lastLoginTime: currentLoginTime,
        previousLoginTime: previousLoginTime
      };
      localStorage.setItem('user', JSON.stringify(userWithLoginTime));
      console.log('Stored user with times:', userWithLoginTime);
      
      
    }
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh', { refreshToken });
    if (response.data.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      if(response.data.refreshToken){
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
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
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
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

  // Create admin account (super admin only)
  createAdmin: async (email, password, role) => {
    try {
      const response = await api.post('/auth/admin/create', { 
        email, 
        password,
        role 
      });
      return response.data;
    } catch (error) {
      console.error('Create admin error:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to create admin account';
      throw new Error(message);
    }
  },
};

export default authService;