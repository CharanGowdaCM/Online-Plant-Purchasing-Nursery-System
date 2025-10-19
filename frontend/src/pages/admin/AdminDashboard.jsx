import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminModules = {
    inventory_admin: {
      title: 'Inventory Management',
      path: '/admin/inventory',
      description: 'Manage product inventory, categories, and stock levels'
    },
    order_admin: {
      title: 'Order Management',
      path: '/admin/orders',
      description: 'Process orders, manage shipments, and handle returns'
    },
    support_admin: {
      title: 'Customer Support',
      path: '/admin/support',
      description: 'Handle customer inquiries and manage support tickets'
    },
    content_admin: {
      title: 'Content Management',
      path: '/admin/content',
      description: 'Manage website content, blog posts, and announcements'
    },
    super_admin: {
      title: 'System Administration',
      path: '/admin/system',
      description: 'Manage users, roles, and system settings'
    }
  };

  // Get the module for the current admin's role
  const currentModule = user?.role ? adminModules[user.role] : null;

  if (!currentModule) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2>Admin Dashboard</h2>
          <p>Welcome, {user.email}</p>
          <hr />
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{currentModule.title}</h5>
              <p className="card-text">{currentModule.description}</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(currentModule.path)}
              >
                Access Module
              </button>
            </div>
          </div>
        </div>

        {user.role === 'super_admin' && (
          <div className="col-12 mt-4">
            <div className="list-group">
              {Object.entries(adminModules).map(([key, module]) => (
                <a 
                  key={key}
                  href={module.path}
                  className="list-group-item list-group-item-action"
                >
                  <h5 className="mb-1">{module.title}</h5>
                  <p className="mb-1">{module.description}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;