import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPlatformStats();
      setStats(response.data || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Super Admin Dashboard</h2>
          <p className="text-muted">System overview and management</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Users</h6>
                  <h3 className="mb-0">{stats?.totalUsers || 0}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-people fs-3 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Orders</h6>
                  <h3 className="mb-0">{stats?.totalOrders || 0}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-cart fs-3 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Products</h6>
                  <h3 className="mb-0">{stats?.totalProducts || 0}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="bi bi-box-seam fs-3 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Revenue</h6>
                  <h3 className="mb-0">₹{stats?.totalRevenue || 0}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="bi bi-currency-rupee fs-3 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Admin Management</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/system/users')}
                >
                  <i className="bi bi-people me-2"></i>
                  User Management
                </button>
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/system/admins')}
                >
                  <i className="bi bi-shield-lock me-2"></i>
                  Admin Role Management
                </button>
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/system/activity-logs')}
                >
                  <i className="bi bi-clock-history me-2"></i>
                  Activity Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">All Modules</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/inventory')}
                >
                  <i className="bi bi-box me-2"></i>
                  Inventory Management
                </button>
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/orders')}
                >
                  <i className="bi bi-cart-check me-2"></i>
                  Order Management
                </button>
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/support')}
                >
                  <i className="bi bi-headset me-2"></i>
                  Support Management
                </button>
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate('/admin/content')}
                >
                  <i className="bi bi-file-text me-2"></i>
                  Content Management
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Recent Orders</h5>
        </div>
        <div className="card-body">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/system/orders')}
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;