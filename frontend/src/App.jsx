import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import CreateProfile from './pages/CreateProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import InventoryManagement from './pages/admin/InventoryManagement';
import ProductManagement from './pages/admin/inventory/ProductManagement';

import './App.css';

// Protected Route Component
const PrivateRoute = ({ children, allowPendingProfile = false }) => {
  const { isAuthenticated, loading } = useAuth();
  const pendingProfile = sessionStorage.getItem('pendingProfile');

  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Allow access if user is authenticated OR if this is the create-profile page for a new signup
  if (isAuthenticated || (allowPendingProfile && pendingProfile)) {
    return children;
  }
  
  return <Navigate to="/" />;
};

// Role-based route guard
const AdminRoute = ({ children, requiredRole }) => {
  const { user, loading, hasAdminAccess } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Super admin can access all admin routes
  // Other admins can only access their specific routes
  if (!user || (!hasAdminAccess(requiredRole))) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Redirect to appropriate dashboard based on role
  const getHomeRoute = () => {
    if (!user) return '/';
    if (user.role.includes('admin') || user.role === 'super_admin') return '/admin';
    return '/dashboard';
  };

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-grow-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* User Routes */}
          <Route 
            path="/create-profile" 
            element={
              <PrivateRoute allowPendingProfile={true}>
                <CreateProfile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <CreateProfile />
              </PrivateRoute>
            } 
          />

          {/* Admin Routes */}
          <Route path="/admin">
            {/* Admin Dashboard - accessible by all admins */}
            <Route 
              index 
              element={
                <AdminRoute requiredRole="any_admin">
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            {/* Inventory Management */}
            <Route 
              path="inventory/*" 
              element={
                <AdminRoute requiredRole="inventory_admin">
                  <Routes>
                    <Route index element={<InventoryManagement />} />
                    <Route path="products" element={<ProductManagement />} />
                    {/* Uncomment when components are created
                    <Route path="categories" element={<CategoryManagement />} />
                    <Route path="stock" element={<StockManagement />} />
                    */}
                  </Routes>
                </AdminRoute>
              } 
            />

            {/* Other admin routes commented out until components are created
            Order Management, Support Management, Content Management, and Super Admin Routes will be added here
            */}
          </Route>

          {/* User Dashboard - Uncomment when component is created
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          */}

          {/* Home Route - Redirects based on role */}
          <Route
            path="/home"
            element={<Navigate to={getHomeRoute()} replace />}
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;