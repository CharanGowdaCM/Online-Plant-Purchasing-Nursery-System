import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const verifyOTP = async (email, otp) => {
    const response = await authService.verifyOTP(email, otp);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth-related data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const isAdmin = () => {
    return user && ['super_admin', 'inventory_admin', 'order_admin', 'support_admin', 'content_admin'].includes(user.role);
  };

  const isSuperAdmin = () => {
    return user && user.role === 'super_admin';
  };

  const getUserRole = () => {
    if (!user) return 'guest';
    if (!user.role) return 'customer';
    return user.role;
  };

  const hasAdminAccess = (requiredRole) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.role === requiredRole;
  };

  const updateUserProfile = (profile) => {
    if (user) {
      const updatedUser = { ...user, profile };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      verifyOTP,
      register, 
      logout, 
      loading,
      updateUserProfile,
      isAuthenticated: authService.isAuthenticated(),
      isAdmin: isAdmin(),
      isSuperAdmin: isSuperAdmin(),
      getUserRole,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};