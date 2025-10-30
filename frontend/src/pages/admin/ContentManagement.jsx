import { useState, useEffect } from 'react';
import contentService from '../../services/contentService';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [blogs, setBlogs] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    // Common fields
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    tags: '',
    is_published: false,
    // Blog-specific
    category: '',
    // Guide-specific
    plant_type: '',
    difficulty_level: 'beginner'
  });
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (activeTab === 'blog') fetchBlogs();
    else fetchGuides();
  }, [activeTab]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await contentService.listBlogPosts();
      console.log('Blogs Response:', response);
      setBlogs(response.posts || response.data || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      alert('Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await contentService.listPlantGuides();
      console.log('Guides Response:', response);
      setGuides(response.guides || response.data || []);
    } catch (err) {
      console.error('Error fetching guides:', err);
      alert('Failed to fetch plant guides');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    
    if (mode === 'edit' && item) {
      // Generate slug from title if editing existing item
      setFormData({
        title: item.title || '',
        slug: item.slug || '',
        content: item.content || '',
        excerpt: item.excerpt || '',
        featured_image_url: item.featured_image_url || '',
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
        is_published: item.is_published || false,
        category: item.category || '',
        plant_type: item.plant_type || '',
        difficulty_level: item.difficulty_level || 'beginner'
      });
      if (item.featured_image_url) {
        setImagePreview(item.featured_image_url);
        setUseImageUrl(true);
      }
    } else {
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image_url: '',
        tags: '',
        is_published: false,
        category: '',
        plant_type: '',
        difficulty_level: 'beginner'
      });
      setImagePreview(null);
      setFeaturedImage(null);
      setUseImageUrl(false);
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image_url: '',
      tags: '',
      is_published: false,
      category: '',
      plant_type: '',
      difficulty_level: 'beginner'
    });
    setImagePreview(null);
    setFeaturedImage(null);
    setUseImageUrl(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-generate slug from title
    if (name === 'title') {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: generatedSlug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let finalImageUrl = formData.featured_image_url;

      // Upload image to Cloudinary if file is selected
      if (featuredImage && !useImageUrl) {
        try {
          finalImageUrl = await uploadToCloudinary(featuredImage);
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          alert('Failed to upload image. Please try again.');
          return;
        }
      }

      if (activeTab === 'blog') {
        // Convert comma-separated tags to array
        const tagsArray = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        const blogData = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt,
          featured_image_url: finalImageUrl,
          category: formData.category,
          tags: tagsArray,
          is_published: formData.is_published
        };

        if (modalMode === 'create') {
          await contentService.createBlogPost(blogData);
          alert('Blog post created successfully!');
        } else {
          await contentService.updateBlogPost(currentItem.id, blogData);
          alert('Blog post updated successfully!');
        }
        fetchBlogs();
      } else {
        // Convert comma-separated tags to array
        const tagsArray = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        const guideData = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt,
          featured_image_url: finalImageUrl,
          plant_type: formData.plant_type,
          difficulty_level: formData.difficulty_level,
          tags: tagsArray,
          is_published: formData.is_published
        };

        if (modalMode === 'create') {
          await contentService.createPlantGuide(guideData);
          alert('Plant guide created successfully!');
        } else {
          await contentService.updatePlantGuide(currentItem.id, guideData);
          alert('Plant guide updated successfully!');
        }
        fetchGuides();
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    try {
      if (type === 'blog') {
        await contentService.deleteBlogPost(id);
        alert('Blog post deleted successfully!');
        fetchBlogs();
      } else {
        await contentService.deletePlantGuide(id);
        alert('Plant guide deleted successfully!');
        fetchGuides();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-6">
          <h2 className="mb-1">
            <i className="bi bi-file-earmark-text text-warning me-2"></i>
            Content Management
          </h2>
          <p className="text-muted">Manage blog posts and plant care guides</p>
        </div>
        <div className="col-md-6 text-end">
          <button 
            className="btn btn-success"
            onClick={() => handleOpenModal('create')}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create New {activeTab === 'blog' ? 'Blog Post' : 'Plant Guide'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Blog Posts</h6>
                  <h3 className="mb-0 fw-bold">{blogs.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-newspaper fs-3 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Plant Guides</h6>
                  <h3 className="mb-0 fw-bold">{guides.length}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-book fs-3 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <i className="bi bi-newspaper me-2"></i>
            Blog Posts
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'guides' ? 'active' : ''}`}
            onClick={() => setActiveTab('guides')}
          >
            <i className="bi bi-book me-2"></i>
            Plant Care Guides
          </button>
        </li>
      </ul>

      {/* Content Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading content...</p>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              {activeTab === 'blog' ? 'Blog Posts' : 'Plant Care Guides'}
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">ID</th>
                    <th>Title & Excerpt</th>
                    {activeTab === 'blog' && <th>Category</th>}
                    {activeTab === 'guides' && <th>Plant Type</th>}
                    {activeTab === 'guides' && <th>Difficulty</th>}
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'blog' ? (
                    blogs.length > 0 ? (
                      blogs.map((blog) => (
                        <tr key={blog.id}>
                          <td className="px-3">
                            <small className="text-muted">#{blog.id?.substring(0, 8)}</small>
                          </td>
                          <td style={{ maxWidth: '350px' }}>
                            <div className="d-flex align-items-start">
                              {blog.featured_image_url && (
                                <img 
                                  src={blog.featured_image_url} 
                                  alt={blog.title}
                                  className="rounded me-2"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-truncate">{blog.title}</div>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                  {blog.slug}
                                </small>
                                {blog.excerpt && (
                                  <small className="text-muted text-truncate d-block">
                                    {blog.excerpt.substring(0, 60)}...
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {blog.category ? (
                              <span className="badge bg-info">{blog.category}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {Array.isArray(blog.tags) && blog.tags.length > 0 ? (
                              <div className="d-flex flex-wrap gap-1">
                                {blog.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="badge bg-secondary">{tag}</span>
                                ))}
                                {blog.tags.length > 2 && (
                                  <span className="badge bg-light text-dark">+{blog.tags.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${blog.is_published ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {blog.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                        
                          <td>
                            <small className="text-muted">{formatDate(blog.created_at)}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleOpenModal('edit', blog)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(blog.id, 'blog')}
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                          <p className="text-muted">No blog posts found. Create your first blog post!</p>
                        </td>
                      </tr>
                    )
                  ) : (
                    guides.length > 0 ? (
                      guides.map((guide) => (
                        <tr key={guide.id}>
                          <td className="px-3">
                            <small className="text-muted">#{guide.id?.substring(0, 8)}</small>
                          </td>
                          <td style={{ maxWidth: '350px' }}>
                            <div className="d-flex align-items-start">
                              {guide.featured_image_url && (
                                <img 
                                  src={guide.featured_image_url} 
                                  alt={guide.title}
                                  className="rounded me-2"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-truncate">{guide.title}</div>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                  {guide.slug}
                                </small>
                                {guide.excerpt && (
                                  <small className="text-muted text-truncate d-block">
                                    {guide.excerpt.substring(0, 60)}...
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {guide.plant_type ? (
                              <span className="badge bg-success">{guide.plant_type}</span>
                            ) : (
                              <span className="text-muted">General</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              guide.difficulty_level === 'beginner' ? 'bg-success' :
                              guide.difficulty_level === 'intermediate' ? 'bg-warning text-dark' :
                              guide.difficulty_level === 'advanced' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {guide.difficulty_level || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {Array.isArray(guide.tags) && guide.tags.length > 0 ? (
                              <div className="d-flex flex-wrap gap-1">
                                {guide.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="badge bg-secondary">{tag}</span>
                                ))}
                                {guide.tags.length > 2 && (
                                  <span className="badge bg-light text-dark">+{guide.tags.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${guide.is_published ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {guide.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">-</small>
                          </td>
                          <td>
                            <small className="text-muted">{formatDate(guide.created_at)}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleOpenModal('edit', guide)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(guide.id, 'guide')}
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                          <p className="text-muted">No plant guides found. Create your first plant care guide!</p>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} 
          tabIndex="-1"
          onClick={handleCloseModal}
        >
          <div 
            className="modal-dialog modal-lg" 
            style={{ maxHeight: '90vh', marginTop: '5vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h5 className="modal-title">
                  <i className={`bi ${activeTab === 'blog' ? 'bi-newspaper' : 'bi-book'} me-2`}></i>
                  {modalMode === 'create' ? 'Create New' : 'Edit'} {activeTab === 'blog' ? 'Blog Post' : 'Plant Guide'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                  {/* Title Field */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter title..."
                    />
                  </div>

                  {/* Slug Field */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Slug <span className="text-danger">*</span>
                      <small className="text-muted ms-2">(Auto-generated from title)</small>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  {/* Excerpt Field */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Excerpt <small className="text-muted">(Optional - Short description)</small>
                    </label>
                    <textarea
                      className="form-control"
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Brief summary for preview..."
                    ></textarea>
                  </div>

                  {/* Content Field */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Content <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      rows="5"
                      placeholder="Write your content here..."
                      style={{ minHeight: '120px' }}
                    ></textarea>
                    <small className="text-muted">
                      {formData.content.length} characters
                    </small>
                  </div>

                  {/* Featured Image */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Featured Image <small className="text-muted">(Optional)</small>
                    </label>
                    
                    {/* Toggle between upload and URL */}
                    <div className="d-flex gap-3 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="imageType"
                          id="imageUploadContent"
                          checked={!useImageUrl}
                          onChange={() => {
                            setUseImageUrl(false);
                            setFormData(prev => ({ ...prev, featured_image_url: '' }));
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label" htmlFor="imageUploadContent" style={{ cursor: 'pointer' }}>
                          <i className="bi bi-upload me-1"></i>
                          Upload Image
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="imageType"
                          id="imageUrlContent"
                          checked={useImageUrl}
                          onChange={() => {
                            setUseImageUrl(true);
                            setFeaturedImage(null);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label" htmlFor="imageUrlContent" style={{ cursor: 'pointer' }}>
                          <i className="bi bi-link-45deg me-1"></i>
                          Image URL
                        </label>
                      </div>
                    </div>

                    {!useImageUrl ? (
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    ) : (
                      <input
                        type="url"
                        className="form-control"
                        name="featured_image_url"
                        value={formData.featured_image_url}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, featured_image_url: e.target.value }));
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    )}

                    {imagePreview && (
                      <div className="mt-3 text-center">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="img-thumbnail"
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '150px', 
                            objectFit: 'cover',
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

                  {/* Blog-specific fields */}
                  {activeTab === 'blog' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Category</label>
                        <input
                          type="text"
                          className="form-control"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          placeholder="e.g., Gardening Tips, Plant Care"
                        />
                      </div>
                    </>
                  )}

                  {/* Guide-specific fields */}
                  {activeTab === 'guides' && (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold">Plant Type</label>
                          <input
                            type="text"
                            className="form-control"
                            name="plant_type"
                            value={formData.plant_type}
                            onChange={handleInputChange}
                            placeholder="e.g., Snake Plant, Succulent"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold">Difficulty Level</label>
                          <select
                            className="form-select"
                            name="difficulty_level"
                            value={formData.difficulty_level}
                            onChange={handleInputChange}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tags Field */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Tags <small className="text-muted">(Comma-separated)</small>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g., watering, sunlight, indoor plants"
                    />
                    <small className="text-muted">Enter tags separated by commas</small>
                  </div>

                  {/* Published Status */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="publishSwitch"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-bold" htmlFor="publishSwitch">
                        Publish {activeTab === 'blog' ? 'Blog Post' : 'Guide'}
                        {formData.is_published ? (
                          <span className="badge bg-success ms-2">Will be Published</span>
                        ) : (
                          <span className="badge bg-warning text-dark ms-2">Draft</span>
                        )}
                      </label>
                    </div>
                    <small className="text-muted d-block mt-1">
                      {formData.is_published 
                        ? 'This content will be visible to all users' 
                        : 'This content will be saved as a draft'}
                    </small>
                  </div>
                </div>
                <div className="modal-footer" style={{ flexShrink: 0, borderTop: '1px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    <i className="bi bi-check-circle me-2"></i>
                    {modalMode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
                   