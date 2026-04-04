import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';
import productService from '../../../services/productService';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

const ProductManagement = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    short_description: '',
    price: '',
    compare_at_price: '',
    botanical_name: '',
    plant_type: '',
    light_requirement: '',
    water_requirement: '',
    growth_rate: '',
    mature_size: '',
    care_level: 'easy',
    pet_friendly: false,
    stock_quantity: '',
    min_stock_threshold: '',
    max_order_quantity: '',
    is_active: true,
    is_featured: false,
    category_id: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [imageUrls, setImageUrls] = useState(['']);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await productService.getAdminCategories();
      if (response && response.success && response.data) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      } else {
        const data = response.data || response;
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      images: files
    }));

    const previews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    setImagePreviews(previews);
  };

  const removePreview = (index) => {
    setImagePreviews((prev) => {
      const updated = prev.slice();
      if (updated[index]?.url) URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
    setFormData((prev) => {
      const imgs = Array.from(prev.images || []);
      imgs.splice(index, 1);
      return { ...prev, images: imgs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name || !formData.sku || !formData.category_id) {
        throw new Error('Name, SKU and Category are required.');
      }

      let imagesPayload = [];

      if (useImageUrl) {
        // Use direct image URLs
        const validUrls = imageUrls.filter(url => url && url.trim() !== '');
        if (validUrls.length === 0) {
          throw new Error('At least one product image URL is required.');
        }
        imagesPayload = validUrls.map((url, idx) => ({
          image_url: url.trim(),
          alt_text: formData.name || `Image ${idx + 1}`,
          display_order: idx,
          is_primary: idx === 0
        }));
      } else {
        // Upload to Cloudinary
        if (!formData.images || formData.images.length === 0) {
          throw new Error('At least one product image is required.');
        }
        const files = Array.from(formData.images);
        const uploadPromises = files.map((file) => uploadToCloudinary(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        imagesPayload = uploadedUrls.map((url, idx) => ({
          image_url: url,
          alt_text: formData.name || `Image ${idx + 1}`,
          display_order: idx,
          is_primary: idx === 0
        }));
      }

      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        short_description: formData.short_description,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        botanical_name: formData.botanical_name,
        plant_type: formData.plant_type,
        light_requirement: formData.light_requirement,
        water_requirement: formData.water_requirement,
        growth_rate: formData.growth_rate,
        mature_size: formData.mature_size,
        care_level: formData.care_level,
        pet_friendly: formData.pet_friendly,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_threshold: parseInt(formData.min_stock_threshold) || 0,
        max_order_quantity: parseInt(formData.max_order_quantity) || 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        category_id: formData.category_id || null,
        images: imagesPayload
      };

      const response = await inventoryService.addProduct(payload);

      if (response && response.success) {
        imagePreviews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
        navigate('/admin/inventory');
      } else {
        throw new Error(response?.message || 'Failed to add product');
      }
    } catch (err) {
      console.error('Add product error:', err);
      setError(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh', paddingBottom: '2rem' }}>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 style={{ color: '#2C5F2D', fontWeight: '700', marginBottom: '0.5rem' }}>
                  <i className="bi bi-plus-circle-fill me-2"></i>
                  Add New Product
                </h2>
                <p style={{ color: '#6B7B5F', marginBottom: 0 }}>Add a new plant to your inventory</p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => navigate('/admin/inventory')}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#2C5F2D',
                  border: '2px solid #2C5F2D',
                  borderRadius: '10px',
                  padding: '0.6rem 1.5rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2C5F2D';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.color = '#2C5F2D';
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>Back to Inventory
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ borderRadius: '12px', border: 'none' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div 
            className="card border-0 shadow-sm mb-4"
            style={{ borderRadius: '16px', overflow: 'hidden' }}
          >
            <div 
              className="card-header"
              style={{
                background: 'linear-gradient(135deg, #2C5F2D 0%, #3a7d52 100%)',
                color: '#FFFFFF',
                padding: '1.25rem 1.5rem',
                borderBottom: 'none'
              }}
            >
              <h5 className="mb-0" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                <i className="bi bi-info-circle-fill me-2"></i>
                Basic Information
              </h5>
            </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    borderRadius: '10px',
                    border: '2px solid #E5E7EB',
                    padding: '0.75rem'
                  }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                  SKU *
                </label>
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
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Loading categories...
                    </option>
                  )}
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
              <div className="col-md-12 mb-3">
                <label className="form-label">
                  Product Images * (you can select multiple)
                </label>
                
                {/* Toggle between upload and URL */}
                <div className="d-flex gap-3 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="imageType"
                      id="imageUpload"
                      checked={!useImageUrl}
                      onChange={() => {
                        setUseImageUrl(false);
                        setImageUrls(['']);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label" htmlFor="imageUpload" style={{ cursor: 'pointer' }}>
                      <i className="bi bi-upload me-1"></i>
                      Upload Images
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="imageType"
                      id="imageUrl"
                      checked={useImageUrl}
                      onChange={() => {
                        setUseImageUrl(true);
                        setFormData(prev => ({ ...prev, images: [] }));
                        setImagePreviews([]);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label" htmlFor="imageUrl" style={{ cursor: 'pointer' }}>
                      <i className="bi bi-link-45deg me-1"></i>
                      Image URLs
                    </label>
                  </div>
                </div>

                {!useImageUrl ? (
                  <>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                      multiple
                      required={imagePreviews.length === 0}
                    />
                    {imagePreviews.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {imagePreviews.map((p, idx) => (
                          <div key={idx} className="position-relative">
                            <img
                              src={p.url}
                              alt={p.name}
                              className="img-thumbnail"
                              style={{
                                width: 120,
                                height: 120,
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  'https://via.placeholder.com/120?text=Invalid';
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ top: 4, right: 4 }}
                              onClick={() => removePreview(idx)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="mb-2">
                        <div className="input-group">
                          <input
                            type="url"
                            className="form-control"
                            placeholder="Enter image URL"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...imageUrls];
                              newUrls[idx] = e.target.value;
                              setImageUrls(newUrls);
                            }}
                            required={idx === 0}
                          />
                          {imageUrls.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => {
                                const newUrls = imageUrls.filter((_, i) => i !== idx);
                                setImageUrls(newUrls);
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                        {url && (
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="img-thumbnail mt-2"
                            style={{ maxHeight: '100px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/100?text=Invalid';
                            }}
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm mt-2"
                      onClick={() => setImageUrls([...imageUrls, ''])}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Add Another URL
                    </button>
                  </div>
                )}
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

        {/* Plant Care Details */}
        <div 
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        >
          <div 
            className="card-header"
            style={{
              background: 'linear-gradient(135deg, #2C5F2D 0%, #3a7d52 100%)',
              color: '#FFFFFF',
              padding: '1.25rem 1.5rem',
              borderBottom: 'none'
            }}
          >
            <h5 className="mb-0" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
              <i className="bi bi-droplet-fill me-2"></i>
              Plant Care Details
            </h5>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                  Light Requirement
                </label>
                <select
                  className="form-select"
                  name="light_requirement"
                  value={formData.light_requirement}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Low Light">Low Light</option>
                  <option value="Medium Light">Medium Light</option>
                  <option value="Bright Light">Bright Light</option>
                  <option value="Direct Sunlight">Direct Sunlight</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Water Requirement</label>
                <select
                  className="form-select"
                  name="water_requirement"
                  value={formData.water_requirement}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Low Water">Low Water</option>
                  <option value="Medium Water">Medium Water</option>
                  <option value="High Water">High Water</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Care Level</label>
                <select
                  className="form-select"
                  name="care_level"
                  value={formData.care_level}
                  onChange={handleChange}
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="difficult">Difficult</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Growth Rate</label>
                <input
                  type="text"
                  className="form-control"
                  name="growth_rate"
                  value={formData.growth_rate}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Mature Size</label>
                <input
                  type="text"
                  className="form-control"
                  name="mature_size"
                  value={formData.mature_size}
                  onChange={handleChange}
                />
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

        {/* Pricing & Inventory */}
        <div 
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        >
          <div 
            className="card-header"
            style={{
              background: 'linear-gradient(135deg, #2C5F2D 0%, #3a7d52 100%)',
              color: '#FFFFFF',
              padding: '1.25rem 1.5rem',
              borderBottom: 'none'
            }}
          >
            <h5 className="mb-0" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
              <i className="bi bi-tag-fill me-2"></i>
              Pricing & Inventory
            </h5>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div className="row g-3">
              <div className="col-md-4">
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
              <div className="col-md-4">
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
              <div className="col-md-4">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Min Stock Threshold</label>
                <input
                  type="number"
                  className="form-control"
                  name="min_stock_threshold"
                  value={formData.min_stock_threshold}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Max Order Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  name="max_order_quantity"
                  value={formData.max_order_quantity}
                  onChange={handleChange}
                  min="1"
                  placeholder="Maximum quantity per order"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Settings */}
        <div 
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        >
          <div 
            className="card-header"
            style={{
              background: 'linear-gradient(135deg, #2C5F2D 0%, #3a7d52 100%)',
              color: '#FFFFFF',
              padding: '1.25rem 1.5rem',
              borderBottom: 'none'
            }}
          >
            <h5 className="mb-0" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
              <i className="bi bi-gear-fill me-2"></i>
              Product Settings
            </h5>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label" htmlFor="is_active" style={{ cursor: 'pointer' }}>
                    <strong>Active Product</strong>
                    <small className="d-block text-muted">Product will be visible to customers</small>
                  </label>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-3 justify-content-end">
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/admin/inventory')}
            disabled={loading}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#6B7B5F',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              padding: '0.75rem 2rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#F5F1E8';
                e.currentTarget.style.borderColor = '#2C5F2D';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </button>
          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              background: loading ? '#97C97D' : 'linear-gradient(135deg, #2C5F2D 0%, #3a7d52 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 2.5rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(44, 95, 45, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(44, 95, 45, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(44, 95, 45, 0.3)';
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Adding Product...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill me-2"></i>
                Add Product
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ProductManagement;
