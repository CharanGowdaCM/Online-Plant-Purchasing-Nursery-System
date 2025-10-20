import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUserProfile = (profile) => {
    if (user) {
      const updatedUser = { ...user, profile };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // IMPORTANT: These functions need to be defined
  const getUserRole = () => {
    if (!user) return 'guest';
    if (!user.role) return 'customer';
    return user.role;
  };

  const isAdmin = () => {
    if (!user) return false;
    return ['super_admin', 'inventory_admin', 'order_admin', 'support_admin', 'content_admin'].includes(user.role);
  };

  const hasAdminAccess = (requiredRole) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    
    // Special case: any admin can access common admin routes
    if (requiredRole === 'any_admin') {
      return ['super_admin', 'inventory_admin', 'order_admin', 'support_admin', 'content_admin'].includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  // IMPORTANT: All functions must be in this value object
  const contextValue = {
    user,
    setUser,
    login,
    register,
    logout,
    loading,
    updateUserProfile,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: isAdmin(),
    getUserRole: getUserRole,  // explicitly passing the function
    hasAdminAccess: hasAdminAccess  // explicitly passing the function
  };

  return (
    <AuthContext.Provider value={contextValue}>
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