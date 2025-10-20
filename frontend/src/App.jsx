import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import CreateProfile from './pages/CreateProfile';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InventoryManagement from './pages/admin/InventoryManagement';
import ProductManagement from './pages/admin/inventory/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import SupportManagement from './pages/admin/SupportManagement';
import ContentManagement from './pages/admin/ContentManagement';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;
  return isAuthenticated ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children, requiredRole }) => {
  const { user, loading, hasAdminAccess } = useAuth();
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;
  if (!user || !hasAdminAccess(requiredRole)) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create-profile" element={<PrivateRoute><CreateProfile /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
          
          <Route path="/admin" element={<AdminRoute requiredRole="any_admin"><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute requiredRole="inventory_admin"><InventoryManagement /></AdminRoute>} />
          <Route path="/admin/inventory/products" element={<AdminRoute requiredRole="inventory_admin"><ProductManagement /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute requiredRole="order_admin"><OrderManagement /></AdminRoute>} />
          <Route path="/admin/support" element={<AdminRoute requiredRole="support_admin"><SupportManagement /></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute requiredRole="content_admin"><ContentManagement /></AdminRoute>} />
          <Route path="/admin/system" element={<AdminRoute requiredRole="super_admin"><SuperAdminDashboard /></AdminRoute>} />
          
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