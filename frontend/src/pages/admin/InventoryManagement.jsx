import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockManagement from '../../components/admin/inventory/StockManagement';

const InventoryManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Inventory Management</h2>
          <p className="text-muted">Manage product inventory and stock levels</p>
        </div>
        <div className="col-md-6 text-end">
          <button
            className="btn btn-success me-2"
            onClick={() => navigate('/admin/inventory/products')}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Product
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => navigate('/admin/inventory/categories')}
          >
            <i className="bi bi-grid me-2"></i>
            Manage Categories
          </button>
        </div>
      </div>

      <StockManagement />
    </div>
  );
};

export default InventoryManagement;