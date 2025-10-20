import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';

const InventoryManagement = () => {
  const navigate = useNavigate();
  const [inventoryData, setInventoryData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchInventoryData();
    fetchLowStockItems();
  }, [filters]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventoryStatus(filters);
      setInventoryData(response.items || []);
    } catch (err) {
      setError('Failed to load inventory data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await inventoryService.getLowStockItems();
      setLowStockItems(response.data || []);
    } catch (err) {
      console.error('Error fetching low stock items:', err);
    }
  };

  const getStockStatusBadge = (status) => {
    switch (status) {
      case 'IN_STOCK':
        return 'badge bg-success';
      case 'LOW':
        return 'badge bg-warning';
      case 'OUT_OF_STOCK':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

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

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <h5 className="alert-heading">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Low Stock Alert
          </h5>
          <p>You have {lowStockItems.length} product(s) with low stock levels.</p>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => setFilters({ ...filters, status: 'LOW' })}
          >
            View Low Stock Items
          </button>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: '', search: '', page: 1, limit: 20 })}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Min Threshold</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No products found
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.image_url || 'https://via.placeholder.com/50'}
                            alt={item.name}
                            className="rounded me-2"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-bold">{item.name}</div>
                            <small className="text-muted">{item.botanical_name}</small>
                          </div>
                        </div>
                      </td>
                      <td>{item.sku}</td>
                      <td>{item.category_name}</td>
                      <td>
                        <span className="fw-bold">{item.stock_quantity}</span>
                      </td>
                      <td>{item.min_stock_threshold || 'N/A'}</td>
                      <td>
                        <span className={getStockStatusBadge(item.stock_status)}>
                          {item.stock_status}
                        </span>
                      </td>
                      <td>₹{item.price}</td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate(`/admin/inventory/products/${item.id}/edit`)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => {/* Open stock update modal */}}
                            title="Update Stock"
                          >
                            <i className="bi bi-box-seam"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;