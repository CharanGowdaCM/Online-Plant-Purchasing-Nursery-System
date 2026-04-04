import { useState, useEffect } from 'react';
import inventoryService from '../../../services/inventoryService';
import productService from '../../../services/productService';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

const EditProductModal = ({ product, onClose, onUpdate }) => {
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
    image: null,
    image_url: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (product && product.id) {
        setFetchingProduct(true);
        setError('');
        
        try {
          console.log(product);
          const response = await productService.getProductById(product.id);
          console.log(response);
          
          if (response.success && response.data) {
            const fetchedProduct = response.data;
            
            const productData = {
              name: fetchedProduct.name || '',
              sku: fetchedProduct.sku || '',
              description: fetchedProduct.description || '',
              short_description: fetchedProduct.short_description || '',
              price: fetchedProduct.price || '',
              compare_at_price: fetchedProduct.compare_at_price || '',
              botanical_name: fetchedProduct.botanical_name || '',
              plant_type: fetchedProduct.plant_type || '',
              light_requirement: fetchedProduct.light_requirement || '',
              water_requirement: fetchedProduct.water_requirement || '',
              growth_rate: fetchedProduct.growth_rate || '',
              mature_size: fetchedProduct.mature_size || '',
              care_level: fetchedProduct.care_level || 'easy',
              pet_friendly: fetchedProduct.pet_friendly || false,
              stock_quantity: fetchedProduct.stock_quantity || 0,
              min_stock_threshold: fetchedProduct.min_stock_threshold || 0,
              max_order_quantity: fetchedProduct.max_order_quantity || 0,
              is_active: fetchedProduct.is_active !== undefined ? fetchedProduct.is_active : true,
              is_featured: fetchedProduct.is_featured || false,
              category_id: fetchedProduct.category_id || '',
              image: null,
              image_url: fetchedProduct.image_url || ''
            };
            
            setFormData(productData);
            
            if (fetchedProduct.image_url) {
              setImagePreview(fetchedProduct.image_url);
              setUseImageUrl(true);
            }
          } else {
            setError('Could not fetch complete product details. Using available data.');
            prefillFromProp();
          }
        } catch (err) {
          console.error('Error fetching product details:', err);
          setError('Failed to load product details. Using available data.');
          prefillFromProp();
        } finally {
          setFetchingProduct(false);
        }
      } else if (product) {
        prefillFromProp();
      }
    };

    const prefillFromProp = () => {
      const productData = {
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || '',
        compare_at_price: product.compare_at_price || '',
        botanical_name: product.botanical_name || '',
        plant_type: product.plant_type || '',
        light_requirement: product.light_requirement || '',
        water_requirement: product.water_requirement || '',
        growth_rate: product.growth_rate || '',
        mature_size: product.mature_size || '',
        care_level: product.care_level || 'easy',
        pet_friendly: product.pet_friendly || false,
        stock_quantity: product.stock_quantity || 0,
        min_stock_threshold: product.min_stock_threshold || 0,
        max_order_quantity: product.max_order_quantity || 0,
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: product.is_featured || false,
        category_id: product.category_id || '',
        image: null,
        image_url: product.image_url || ''
      };
      setFormData(productData);
      
      if (product.image_url) {
        setImagePreview(product.image_url);
        setUseImageUrl(true);
      }
    };

    fetchProductDetails();
  }, [product]);

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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalImageUrl = formData.image_url;

      if (formData.image && !useImageUrl) {
        try {
          finalImageUrl = await uploadToCloudinary(formData.image);
        } catch (err) {
          setError('Failed to upload image. Please try again.');
          setLoading(false);
          return;
        }
      }

      const updateData = {
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
      };

      if (finalImageUrl) {
        updateData.images = [
          {
            image_url: finalImageUrl,
            alt_text: formData.name,
            display_order: 0,
            is_primary: true
          }
        ];
      }

      const response = await inventoryService.editProduct(product.id, updateData);

      if (response.success) {
        onUpdate();
        onClose();
      } else {
        setError(response.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal show d-block" 
      style={{ 
        backgroundColor: 'rgba(44, 95, 45, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div 
          className="modal-content border-0"
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            maxHeight: '90vh'
          }}
        >
          {/* Header */}
          <div 
            className="modal-header"
            style={{
              background: 'linear-gradient(135deg, #2C5F2D 0%, #4A8A4D 100%)',
              border: 'none',
              padding: '1.5rem 2rem',
              color: '#FFFFFF'
            }}
          >
            <h5 className="modal-title fw-bold" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-pencil-square me-2"></i>
              Edit Product
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose} 
              disabled={fetchingProduct}
              style={{ opacity: 0.9 }}
            ></button>
          </div>

          <div 
            className="modal-body"
            style={{
              backgroundColor: '#F5F1E8',
              padding: '2rem'
            }}
          >
            {fetchingProduct ? (
              <div className="text-center py-5">
                <div 
                  className="spinner-border mb-3" 
                  role="status"
                  style={{ 
                    width: '3rem', 
                    height: '3rem',
                    color: '#2C5F2D'
                  }}
                >
                  <span className="visually-hidden">Loading product details...</span>
                </div>
                <p style={{ color: '#6B7B5F', fontWeight: '600' }}>
                  Loading product details...
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div 
                    className="alert alert-dismissible fade show mb-4" 
                    role="alert"
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setError('')}
                      style={{ fontSize: '0.8rem' }}
                    ></button>
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
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-info-circle me-2" style={{ color: '#97C97D' }}></i>
                        Basic Information
                      </h6>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#FFFFFF' }}>
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

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Botanical Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="botanical_name"
                            value={formData.botanical_name}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            SKU
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Category
                          </label>
                          <select
                            className="form-select"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Short Description
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="short_description"
                            value={formData.short_description}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Description
                          </label>
                          <textarea
                            className="form-control"
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem',
                              resize: 'vertical'
                            }}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Image */}
                  <div 
                    className="card border-0 shadow-sm mb-4"
                    style={{ borderRadius: '16px', overflow: 'hidden' }}
                  >
                    <div 
                      className="card-header"
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-image me-2" style={{ color: '#97C97D' }}></i>
                        Product Image
                      </h6>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="mb-3">
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="imageType"
                              id="imageUpload"
                              checked={!useImageUrl}
                              onChange={() => {
                                setUseImageUrl(false);
                                setFormData(prev => ({ ...prev, image_url: '' }));
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label" htmlFor="imageUpload" style={{ cursor: 'pointer', color: '#2C5F2D' }}>
                              <i className="bi bi-upload me-1"></i>
                              Upload Image
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
                                setFormData(prev => ({ ...prev, image: null }));
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label" htmlFor="imageUrl" style={{ cursor: 'pointer', color: '#2C5F2D' }}>
                              <i className="bi bi-link-45deg me-1"></i>
                              Image URL
                            </label>
                          </div>
                        </div>
                      </div>

                      {!useImageUrl ? (
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{
                            borderRadius: '10px',
                            border: '2px solid #E5E7EB',
                            padding: '0.75rem'
                          }}
                        />
                      ) : (
                        <input
                          type="url"
                          className="form-control"
                          placeholder="Enter image URL"
                          value={formData.image_url}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, image_url: e.target.value }));
                            setImagePreview(e.target.value);
                          }}
                          style={{
                            borderRadius: '10px',
                            border: '2px solid #E5E7EB',
                            padding: '0.75rem'
                          }}
                        />
                      )}

                      {imagePreview && (
                        <div className="mt-3 text-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-thumbnail"
                            style={{ 
                              maxHeight: '200px',
                              borderRadius: '12px',
                              border: '3px solid #E5E7EB'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/200';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div 
                    className="card border-0 shadow-sm mb-4"
                    style={{ borderRadius: '16px', overflow: 'hidden' }}
                  >
                    <div 
                      className="card-header"
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-currency-rupee me-2" style={{ color: '#97C97D' }}></i>
                        Pricing
                      </h6>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Price *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Compare at Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            name="compare_at_price"
                            value={formData.compare_at_price}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div 
                    className="card border-0 shadow-sm mb-4"
                    style={{ borderRadius: '16px', overflow: 'hidden' }}
                  >
                    <div 
                      className="card-header"
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-boxes me-2" style={{ color: '#97C97D' }}></i>
                        Inventory
                      </h6>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Stock Quantity
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="stock_quantity"
                            value={formData.stock_quantity}
                            onChange={handleChange}
                            min="0"
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Min Stock Threshold
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="min_stock_threshold"
                            value={formData.min_stock_threshold}
                            onChange={handleChange}
                            min="0"
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Max Order Quantity
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="max_order_quantity"
                            value={formData.max_order_quantity}
                            onChange={handleChange}
                            min="1"
                            placeholder="Maximum quantity per order"
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plant Details */}
                  <div 
                    className="card border-0 shadow-sm mb-4"
                    style={{ borderRadius: '16px', overflow: 'hidden' }}
                  >
                    <div 
                      className="card-header"
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-flower1 me-2" style={{ color: '#97C97D' }}></i>
                        Plant Care Details
                      </h6>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Plant Type
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="plant_type"
                            value={formData.plant_type}
                            onChange={handleChange}
                            placeholder="e.g., Succulent, Fern, Flowering"
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Care Level
                          </label>
                          <select 
                            className="form-select"
                            name="care_level"
                            value={formData.care_level}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          >
                            <option value="easy">Easy</option>
                            <option value="moderate">Moderate</option>
                            <option value="difficult">Difficult</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Light Requirement
                          </label>
                          <select 
                            className="form-select"
                            name="light_requirement"
                            value={formData.light_requirement}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Low Light">Low Light</option>
                            <option value="Medium Light">Medium Light</option>
                            <option value="Bright Light">Bright Light</option>
                            <option value="Direct Sunlight">Direct Sunlight</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Water Requirement
                          </label>
                          <select 
                            className="form-select"
                            name="water_requirement"
                            value={formData.water_requirement}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Low Water">Low Water</option>
                            <option value="Medium Water">Medium Water</option>
                            <option value="High Water">High Water</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Growth Rate
                          </label>
                          <select
                            className="form-select"
                            name="growth_rate"
                            value={formData.growth_rate}
                            onChange={handleChange}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Slow">Slow</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Fast">Fast</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Mature Size
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="mature_size"
                            value={formData.mature_size}
                            onChange={handleChange}
                            placeholder="e.g., 12-18 inches"
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div 
                    className="card border-0 shadow-sm mb-4"
                    style={{ borderRadius: '16px', overflow: 'hidden' }}
                  >
                    <div 
                      className="card-header"
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-toggles me-2" style={{ color: '#97C97D' }}></i>
                        Product Settings
                      </h6>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <div 
                            className="p-3 rounded text-center"
                            style={{
                              backgroundColor: formData.pet_friendly ? '#D1FAE5' : '#F8F6F1',
                              border: `2px solid ${formData.pet_friendly ? '#2C5F2D' : '#E5E7EB'}`,
                              borderRadius: '12px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => setFormData(prev => ({ ...prev, pet_friendly: !prev.pet_friendly }))}
                          >
                            <div className="form-check d-flex align-items-center justify-content-center">
                              <input
                                type="checkbox"
                                className="form-check-input me-2"
                                id="pet_friendly"
                                name="pet_friendly"
                                checked={formData.pet_friendly}
                                onChange={handleChange}
                                style={{ 
                                  cursor: 'pointer',
                                  width: '20px',
                                  height: '20px'
                                }}
                              />
                              <label 
                                className="form-check-label fw-semibold" 
                                htmlFor="pet_friendly"
                                style={{ 
                                  cursor: 'pointer',
                                  color: '#2C5F2D',
                                  fontSize: '0.95rem'
                                }}
                              >
                                <i className="bi bi-heart-fill me-1" style={{ color: '#E85D75' }}></i>
                                Pet Friendly
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div 
                            className="p-3 rounded text-center"
                            style={{
                              backgroundColor: formData.is_active ? '#D1FAE5' : '#F8F6F1',
                              border: `2px solid ${formData.is_active ? '#2C5F2D' : '#E5E7EB'}`,
                              borderRadius: '12px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                          >
                            <div className="form-check d-flex align-items-center justify-content-center">
                              <input
                                type="checkbox"
                                className="form-check-input me-2"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                style={{ 
                                  cursor: 'pointer',
                                  width: '20px',
                                  height: '20px'
                                }}
                              />
                              <label 
                                className="form-check-label fw-semibold" 
                                htmlFor="is_active"
                                style={{ 
                                  cursor: 'pointer',
                                  color: '#2C5F2D',
                                  fontSize: '0.95rem'
                                }}
                              >
                                <i className="bi bi-check-circle-fill me-1" style={{ color: '#2C5F2D' }}></i>
                                Active
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div 
                            className="p-3 rounded text-center"
                            style={{
                              backgroundColor: formData.is_featured ? '#FEF3C7' : '#F8F6F1',
                              border: `2px solid ${formData.is_featured ? '#FDB022' : '#E5E7EB'}`,
                              borderRadius: '12px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                          >
                            <div className="form-check d-flex align-items-center justify-content-center">
                              <input
                                type="checkbox"
                                className="form-check-input me-2"
                                id="is_featured"
                                name="is_featured"
                                checked={formData.is_featured}
                                onChange={handleChange}
                                style={{ 
                                  cursor: 'pointer',
                                  width: '20px',
                                  height: '20px'
                                }}
                              />
                              <label 
                                className="form-check-label fw-semibold" 
                                htmlFor="is_featured"
                                style={{ 
                                  cursor: 'pointer',
                                  color: '#92400E',
                                  fontSize: '0.95rem'
                                }}
                              >
                                <i className="bi bi-star-fill me-1" style={{ color: '#FDB022' }}></i>
                                Featured
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div 
                    className="d-flex gap-3 justify-content-end"
                    style={{
                      padding: '1.5rem',
                      backgroundColor: '#F8F6F1',
                      borderRadius: '16px',
                      marginTop: '1rem'
                    }}
                  >
                    <button 
                      type="button" 
                      className="btn fw-semibold"
                      onClick={onClose}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#6B7B5F',
                        border: '2px solid #E5E7EB',
                        borderRadius: '10px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#E5E7EB';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn fw-bold"
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? '#E5E7EB' : '#2C5F2D',
                        color: loading ? '#9CA3AF' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = '#1F4520';
                          e.target.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = '#2C5F2D';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;