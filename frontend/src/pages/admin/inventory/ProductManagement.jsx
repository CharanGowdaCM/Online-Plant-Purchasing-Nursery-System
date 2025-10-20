import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';
import productService from '../../../services/productService';

const ProductManagement = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    price: '',
    compare_at_price: '',
    description: '',
    short_description: '',
    botanical_name: '',
    plant_type: '',
    light_requirement: '',
    water_requirement: '',
    growth_rate: '',
    mature_size: '',
    care_level: 'easy',
    pet_friendly: false,
    stock_quantity: '',
    reorder_level: '10',
    max_order_quantity: '100'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await inventoryService.addProduct(formData);
      navigate('/admin/inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Add New Product</h2>
          <p className="text-muted">Add a new plant to your inventory</p>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-outline-secondary" onClick={() => navigate('/admin/inventory')}>
            <i className="bi bi-arrow-left me-2"></i>Back to Inventory
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  className="form-control"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Botanical Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="botanical_name"
                  value={formData.botanical_name}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plant Type</label>
                <input
                  type="text"
                  className="form-control"
                  name="plant_type"
                  value={formData.plant_type}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Short Description</label>
                <input
                  type="text"
                  className="form-control"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">Plant Care Details</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Light Requirement</label>
                <select className="form-select" name="light_requirement" value={formData.light_requirement} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Low Light">Low Light</option>
                  <option value="Medium Light">Medium Light</option>
                  <option value="Bright Light">Bright Light</option>
                  <option value="Direct Sunlight">Direct Sunlight</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Water Requirement</label>
                <select className="form-select" name="water_requirement" value={formData.water_requirement} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Low Water">Low Water</option>
                  <option value="Medium Water">Medium Water</option>
                  <option value="High Water">High Water</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Care Level</label>
                <select className="form-select" name="care_level" value={formData.care_level} onChange={handleChange}>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="difficult">Difficult</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Growth Rate</label>
                <input type="text" className="form-control" name="growth_rate" value={formData.growth_rate} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Mature Size</label>
                <input type="text" className="form-control" name="mature_size" value={formData.mature_size} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <div className="form-check mt-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="pet_friendly"
                    name="pet_friendly"
                    checked={formData.pet_friendly}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="pet_friendly">
                    Pet Friendly
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">Pricing & Inventory</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Compare at Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="compare_at_price"
                  value={formData.compare_at_price}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Reorder Level</label>
                <input
                  type="number"
                  className="form-control"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Max Order Qty</label>
                <input
                  type="number"
                  className="form-control"
                  name="max_order_quantity"
                  value={formData.max_order_quantity}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/inventory')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductManagement;