import { useState, useEffect } from 'react';
import productService from '../../../services/productService';
import inventoryService from '../../../services/inventoryService';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await inventoryService.listCategories();
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
        if (!response.success) {
          setError(response.message || 'Failed to fetch categories');
        }
      }
    } catch (err) {
      setError('Failed to fetch categories');
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await inventoryService.updateCategory(editingId, formData);
        setSuccess('Category updated successfully!');
      } else {
        await inventoryService.addCategory(formData);
        setSuccess('Category added successfully!');
      }
      fetchCategories();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id || ''
    });
    setEditingId(category.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await productService.deleteCategory(id);
      setSuccess('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: ''
    });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#F5F1E8', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container-fluid px-4">
        {/* Page Header */}
        <div className="mb-4">
          <h2 className="fw-bold mb-2" style={{ color: '#2C5F2D' }}>
            <i className="bi bi-folder-fill me-3" style={{ color: '#97C97D' }}></i>
            Category Management
          </h2>
          <p style={{ color: '#6B7B5F', fontSize: '1rem' }}>
            Organize and manage your product categories
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div 
            className="alert border-0 d-flex align-items-center mb-4" 
            role="alert"
            style={{
              backgroundColor: '#E8F5E9',
              color: '#2C5F2D',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}
          >
            <i className="bi bi-check-circle-fill me-3" style={{ fontSize: '1.3rem' }}></i>
            <div className="fw-semibold flex-grow-1">{success}</div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess('')}
              style={{ fontSize: '0.8rem', opacity: 0.7 }}
            ></button>
          </div>
        )}

        <div className="row g-4">
          {/* Left Column - Form */}
          <div className="col-lg-4">
            <div 
              className="card border-0 shadow-sm"
              style={{
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                position: 'sticky',
                top: '2rem'
              }}
            >
              {/* Card Header */}
              <div 
                className="card-header border-0"
                style={{
                  backgroundColor: '#F8F6F1',
                  padding: '1.5rem',
                  borderRadius: '16px 16px 0 0'
                }}
              >
                <h5 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                  <i className={`bi ${editingId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </h5>
              </div>

              <div className="card-body p-4">
                {/* Error Message */}
                {error && (
                  <div 
                    className="alert border-0 d-flex align-items-start mb-4" 
                    role="alert"
                    style={{
                      backgroundColor: '#FFF5F5',
                      color: '#E85D75',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                    <div>{error}</div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  {/* Name Field */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2"
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Category Name <span style={{ color: '#E85D75' }}>*</span>
                    </label>
                    <div 
                      className="input-group"
                      style={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#F8F6F1'
                      }}
                    >
                      <span 
                        className="input-group-text border-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className="bi bi-tag-fill"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-0 shadow-none"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        required
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2C5F2D',
                          padding: '0.75rem 0.5rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Slug Field */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2"
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Slug
                    </label>
                    <div 
                      className="input-group"
                      style={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#F8F6F1'
                      }}
                    >
                      <span 
                        className="input-group-text border-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className="bi bi-link-45deg"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-0 shadow-none"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="category-slug"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2C5F2D',
                          padding: '0.75rem 0.5rem'
                        }}
                      />
                    </div>
                    <small style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                      URL-friendly version (e.g., indoor-plants)
                    </small>
                  </div>

                  {/* Description Field */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2"
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Description
                    </label>
                    <textarea
                      className="form-control shadow-none"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      placeholder="Brief description of the category"
                      style={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        backgroundColor: '#F8F6F1',
                        color: '#2C5F2D',
                        padding: '0.75rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Parent Category Field */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2"
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Parent Category
                    </label>
                    <div 
                      className="input-group"
                      style={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#F8F6F1'
                      }}
                    >
                      <span 
                        className="input-group-text border-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className="bi bi-diagram-3-fill"></i>
                      </span>
                      <select
                        className="form-select border-0 shadow-none"
                        value={formData.parent_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2C5F2D',
                          padding: '0.75rem 0.5rem'
                        }}
                      >
                        <option value="">None (Top Level)</option>
                        {categories.filter(cat => cat.id !== editingId).map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <small style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                      Leave empty for a top-level category
                    </small>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className="btn fw-bold shadow flex-grow-1" 
                      disabled={loading}
                      style={{
                        backgroundColor: '#2C5F2D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.65rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.target.style.backgroundColor = '#1e4620';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2C5F2D';
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" style={{ width: '1rem', height: '1rem' }}></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className={`bi ${editingId ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                          {editingId ? 'Update Category' : 'Add Category'}
                        </>
                      )}
                    </button>
                    {editingId && (
                      <button 
                        type="button" 
                        className="btn fw-semibold"
                        onClick={resetForm}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.65rem 1rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#E5E7EB';
                          e.target.style.color = '#2C5F2D';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6B7B5F';
                        }}
                      >
                        <i className="bi bi-x-lg me-2"></i>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Categories List */}
          <div className="col-lg-8">
            <div 
              className="card border-0 shadow-sm"
              style={{
                borderRadius: '16px',
                backgroundColor: '#FFFFFF'
              }}
            >
              {/* Card Header */}
              <div 
                className="card-header border-0"
                style={{
                  backgroundColor: '#F8F6F1',
                  padding: '1.5rem',
                  borderRadius: '16px 16px 0 0'
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                    <i className="bi bi-list-ul me-2"></i>
                    All Categories
                  </h5>
                  <span 
                    className="badge"
                    style={{
                      backgroundColor: '#E8F5E9',
                      color: '#2C5F2D',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      borderRadius: '8px'
                    }}
                  >
                    {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                  </span>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ backgroundColor: '#F8F6F1' }}>
                        <th className="py-3 px-4 fw-semibold" style={{ color: '#2C5F2D', border: 'none' }}>
                          <i className="bi bi-tag me-2"></i>Name
                        </th>
                        <th className="py-3 px-4 fw-semibold" style={{ color: '#2C5F2D', border: 'none' }}>
                          <i className="bi bi-text-paragraph me-2"></i>Description
                        </th>
                        <th className="py-3 px-4 fw-semibold" style={{ color: '#2C5F2D', border: 'none' }}>
                          <i className="bi bi-diagram-3 me-2"></i>Parent
                        </th>
                        <th className="py-3 px-4 fw-semibold text-center" style={{ color: '#2C5F2D', border: 'none' }}>
                          <i className="bi bi-gear me-2"></i>Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr 
                          key={category.id}
                          style={{
                            borderBottom: index === categories.length - 1 ? 'none' : '1px solid #E5E7EB',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F6F1'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="py-3 px-4" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                            {category.name}
                          </td>
                          <td className="py-3 px-4" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                            {category.description || <span style={{ fontStyle: 'italic', color: '#B0BBA8' }}>No description</span>}
                          </td>
                          <td className="py-3 px-4">
                            {category.parent_id ? (
                              <span 
                                className="badge"
                                style={{
                                  backgroundColor: '#E3F2FD',
                                  color: '#1976D2',
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  borderRadius: '8px'
                                }}
                              >
                                {categories.find(cat => cat.id === category.parent_id)?.name || '-'}
                              </span>
                            ) : (
                              <span style={{ color: '#B0BBA8', fontSize: '0.9rem', fontStyle: 'italic' }}>Top Level</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn fw-semibold"
                                onClick={() => handleEdit(category)}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#2C5F2D',
                                  border: '1px solid #2C5F2D',
                                  borderRadius: '8px 0 0 8px',
                                  padding: '0.4rem 0.8rem',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#2C5F2D';
                                  e.target.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#2C5F2D';
                                }}
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Edit
                              </button>
                              <button
                                className="btn fw-semibold"
                                onClick={() => handleDelete(category.id)}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#E85D75',
                                  border: '1px solid #E85D75',
                                  borderLeft: 'none',
                                  borderRadius: '0 8px 8px 0',
                                  padding: '0.4rem 0.8rem',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#E85D75';
                                  e.target.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#E85D75';
                                }}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-5">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                            <h5 className="fw-bold mb-2" style={{ color: '#2C5F2D' }}>No Categories Yet</h5>
                            <p style={{ color: '#6B7B5F' }}>Start by adding your first category</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;