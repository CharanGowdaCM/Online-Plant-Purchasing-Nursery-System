import { useState, useEffect } from 'react';
import inventoryService from '../../../services/inventoryService';
import EditProductModal from './EditProductModal';

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingStock, setEditingStock] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStockQuantity, setNewStockQuantity] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryService.getInventoryStatus();
      console.log("Inventory Response:", response);
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch inventory');
    }
  };

  const openStockUpdateModal = (product) => {
    setSelectedProduct(product);
    setNewStockQuantity(product.stock_quantity.toString());
    setShowStockModal(true);
  };

  const handleStockUpdate = async () => {
    if (!newStockQuantity || isNaN(newStockQuantity) || parseInt(newStockQuantity) < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await inventoryService.updateStock(selectedProduct.id, {
        quantity: parseInt(newStockQuantity, 10), operation: 'increase'
      });
      await fetchInventory();
      setShowStockModal(false);
      setSelectedProduct(null);
      setNewStockQuantity('');
    } catch (err) {
      setError('Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const handleReorderLevelUpdate = async (productId, currentLevel) => {
    const newLevel = window.prompt('Enter new reorder level:', currentLevel);
    if (!newLevel || isNaN(newLevel) || newLevel < 0) {
      alert('Please enter a valid reorder level');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await inventoryService.updateStock(productId, {
        reorder_level: parseInt(newLevel, 10)
      });
      fetchInventory();
    } catch (err) {
      setError('Failed to update reorder level');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Stock Management</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={fetchInventory}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
        
                <th>Current Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>{product.name}</div>
                    </div>
                  </td>
                 
                  <td>
                    <span className={`badge ${
                      product.stock_quantity <= product.reorder_level 
                        ? 'bg-danger' 
                        : 'bg-success'
                    }`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td>
                    {product.stock_quantity <= product.reorder_level ? (
                      <span className="badge bg-warning">Low Stock</span>
                    ) : (
                      <span className="badge bg-success">In Stock</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => openStockUpdateModal(product)}
                        disabled={loading && editingStock === product.id}
                      >
                        Update Stock
                      </button>
                      <button
                        className="btn btn-outline-info"
                        onClick={() => setEditingProduct(product)}
                      >
                        Edit Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Stock</h5>
                <button type="button" className="btn-close" onClick={() => setShowStockModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Product: {selectedProduct?.name}</label>
                  <div className="input-group">
                    <span className="input-group-text">Quantity</span>
                    <input
                      type="number"
                      className="form-control"
                      value={newStockQuantity}
                      onChange={(e) => setNewStockQuantity(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStockUpdate}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={fetchInventory}
        />
      )}
    </div>
  );
};

export default StockManagement;