// Developer: K Akhilesh
// Keywords: axios, API_BASE_URL, interceptors, token refresh, accessToken, refreshToken, 
// request interceptor, response interceptor, authentication, queue handling, 
// error management, retry request, localStorage, API configuration


import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If this request was for auth (login/register/forgot/reset), don't try to
    // refresh tokens or redirect the user on 401 — let the caller handle the error.
    // This prevents the login flow from being interrupted by the global
    // token-refresh redirect logic when credentials are invalid.
    const authPaths = [
      '/auth/login',
      '/auth/signup',
      '/auth/signup/verify',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    if (originalRequest && originalRequest.url) {
      const isAuthRequest = authPaths.some(p => originalRequest.url.includes(p));
      if (isAuthRequest) {
        return Promise.reject(error);
      }
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      isRefreshing = false;
      localStorage.clear();
      window.location.href = '/';
      return Promise.reject(error);
    }

    try {
      console.log('Attempting to refresh token...');
      
      // Call refresh endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
        refreshToken
      });
      console.log('Refresh token response:', response.data);

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        console.log('Token refresh successful');
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Ensure originalRequest has headers and set its Authorization
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Update the original request with new token


        // Process all queued requests with the new token
        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry the original request with the new token
        return api(originalRequest);
      } else {
        // Token refresh API returned success: false
        throw new Error(response.data.message || 'Token refresh failed');
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Process queued requests with error
      processQueue(refreshError, null);
      isRefreshing = false;
      
      // Clear storage and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      window.location.href = '/';
      return Promise.reject(refreshError);
    }
  }
);

export default api;