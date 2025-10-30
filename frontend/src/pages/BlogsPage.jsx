/**
 * Developer: Charan Gowda C M
 * Description: This component renders the main Blog Page for users. It fetches published blog posts 
 * from the backend using `contentService`, supports searching, filtering by category, and sorting by 
 * date, popularity, or title. It dynamically updates displayed results and provides an interactive 
 * UI to view individual blog details through a modal. The layout includes a hero section, filters, 
 * blog grid, and detailed modal view with tags, images, and metadata.
 */




import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import contentService from '../services/contentService';

const BlogsPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterAndSortBlogs();
  }, [blogs, searchQuery, selectedCategory, sortBy]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await contentService.listBlogPostsUser();
      
      const publishedBlogs = (response.posts || response.data || []).filter(
        blog => blog.is_published === true
      );
      
      setBlogs(publishedBlogs);
      
      const uniqueCategories = [...new Set(
        publishedBlogs
          .map(blog => blog.category)
          .filter(cat => cat && cat.trim() !== '')
      )];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBlogs = () => {
    let filtered = [...blogs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query) ||
        blog.excerpt?.toLowerCase().includes(query) ||
        (Array.isArray(blog.tags) && blog.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(blog => blog.category === selectedCategory);
    }

    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredBlogs(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleBlogClick = (blog) => {
    setSelectedBlog(blog);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBlog(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('latest');
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#F5F1E8' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2C5F2D 0%, #1e4620 100%)',
        color: 'white',
        padding: '80px 0 60px'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="display-4 fw-bold mb-3">
                <i className="bi bi-newspaper me-3" style={{ color: '#97C97D' }}></i>
                Plant Care Blog
              </h1>
              <p className="lead mb-4" style={{ color: '#E5E7EB' }}>
                Discover expert tips, guides, and insights about plants and gardening
              </p>
              <div className="d-flex justify-content-center gap-3">
                <div 
                  className="rounded px-4 py-3"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <h3 className="mb-0 fw-bold">{blogs.length}</h3>
                  <small style={{ color: '#C8E6C9' }}>Articles</small>
                </div>
                <div 
                  className="rounded px-4 py-3"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <h3 className="mb-0 fw-bold">{categories.length}</h3>
                  <small style={{ color: '#C8E6C9' }}>Categories</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {/* Search and Filters */}
        <div 
          className="card shadow-sm mb-4 border-0"
          style={{
            borderRadius: '16px',
            backgroundColor: '#FFFFFF'
          }}
        >
          <div className="card-body p-4">
            <div className="row g-3">
              {/* Search Bar */}
              <div className="col-lg-5">
                <label className="form-label fw-semibold mb-2" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                  <i className="bi bi-search me-2"></i>Search
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
                    style={{ backgroundColor: 'transparent', color: '#6B7B5F' }}
                  >
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 shadow-none"
                    placeholder="Search by title, content, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#2C5F2D'
                    }}
                  />
                  {searchQuery && (
                    <button 
                      className="btn border-0"
                      onClick={() => setSearchQuery('')}
                      style={{ backgroundColor: 'transparent', color: '#E85D75' }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="col-lg-3">
                <label className="form-label fw-semibold mb-2" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                  <i className="bi bi-folder me-2"></i>Category
                </label>
                <select
                  className="form-select shadow-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: '#F8F6F1',
                    color: '#2C5F2D',
                    padding: '0.6rem'
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category, idx) => (
                    <option key={idx} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="col-lg-3">
                <label className="form-label fw-semibold mb-2" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                  <i className="bi bi-sort-down me-2"></i>Sort By
                </label>
                <select
                  className="form-select shadow-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: '#F8F6F1',
                    color: '#2C5F2D',
                    padding: '0.6rem'
                  }}
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="col-lg-1">
                <label className="form-label mb-2" style={{ fontSize: '0.9rem', opacity: 0 }}>.</label>
                <button 
                  className="btn w-100"
                  onClick={clearFilters}
                  title="Clear all filters"
                  style={{
                    backgroundColor: '#FFF5F5',
                    color: '#E85D75',
                    border: '2px solid #E85D75',
                    borderRadius: '12px',
                    padding: '0.6rem'
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedCategory !== 'all') && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                <small className="fw-semibold me-2" style={{ color: '#6B7B5F' }}>Active filters:</small>
                {searchQuery && (
                  <span 
                    className="badge me-2"
                    style={{
                      backgroundColor: '#E8F5E9',
                      color: '#2C5F2D',
                      padding: '0.5rem 0.8rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px'
                    }}
                  >
                    Search: "{searchQuery}"
                    <i 
                      className="bi bi-x ms-2" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSearchQuery('')}
                    ></i>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span 
                    className="badge me-2"
                    style={{
                      backgroundColor: '#E3F2FD',
                      color: '#1976D2',
                      padding: '0.5rem 0.8rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px'
                    }}
                  >
                    Category: {selectedCategory}
                    <i 
                      className="bi bi-x ms-2" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCategory('all')}
                    ></i>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
            {filteredBlogs.length === 0 ? 'No blogs found' : 
             filteredBlogs.length === 1 ? '1 blog found' :
             `${filteredBlogs.length} blogs found`}
          </h5>
          {filteredBlogs.length < blogs.length && (
            <small style={{ color: '#6B7B5F' }}>
              (filtered from {blogs.length} total)
            </small>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div 
              className="spinner-border mb-3" 
              style={{ 
                width: '3rem', 
                height: '3rem',
                color: '#2C5F2D',
                borderWidth: '0.3rem'
              }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: '#6B7B5F', fontWeight: '600' }}>Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          /* Empty State */
          <div 
            className="card border-0 shadow-sm"
            style={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div className="card-body text-center py-5">
              <div className="mb-4" style={{ fontSize: '5rem' }}>📚</div>
              <h4 className="fw-bold mb-3" style={{ color: '#2C5F2D' }}>No Blogs Found</h4>
              <p className="mb-4" style={{ color: '#6B7B5F', fontSize: '1.05rem' }}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'No published blogs available at the moment'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button 
                  className="btn fw-semibold shadow"
                  onClick={clearFilters}
                  style={{
                    backgroundColor: '#2C5F2D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.8rem 2rem'
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Blog Cards Grid */
          <div className="row g-4">
            {filteredBlogs.map((blog) => (
              <div key={blog.id} className="col-lg-4 col-md-6">
                <div 
                  className="card h-100 border-0 shadow-sm"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(44, 95, 45, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(44, 95, 45, 0.08)';
                  }}
                >
                  {/* Featured Image */}
                  {blog.featured_image_url && (
                    <div style={{ position: 'relative', overflow: 'hidden', height: '200px' }}>
                      <img
                        src={(() => {
                          try {
                            const parsed = JSON.parse(blog.featured_image_url);
                            return parsed.image_url?.replace(/\/$/, '') || blog.featured_image_url;
                          } catch {
                            return blog.featured_image_url?.replace(/\/$/, '') || '';
                          }
                        })()}
                        className="card-img-top"
                        alt={blog.title}
                        style={{ 
                          height: '100%', 
                          width: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      />
                    </div>
                  )}

                  <div className="card-body d-flex flex-column p-4">
                    {/* Category Badge */}
                    {blog.category && (
                      <div className="mb-3">
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: '#E8F5E9',
                            color: '#2C5F2D',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            borderRadius: '8px'
                          }}
                        >
                          {blog.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h5 className="card-title fw-bold mb-3" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: '#2C5F2D',
                      fontSize: '1.2rem'
                    }}>
                      {blog.title}
                    </h5>

                    {/* Excerpt */}
                    <p className="card-text mb-3" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                      color: '#6B7B5F',
                      fontSize: '0.95rem',
                      lineHeight: '1.6'
                    }}>
                      {blog.excerpt || blog.content.substring(0, 150) + '...'}
                    </p>

                    {/* Tags */}
                    {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                      <div className="mb-3">
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="badge me-1 mb-1"
                            style={{
                              backgroundColor: '#F8F6F1',
                              color: '#6B7B5F',
                              border: '1px solid #E5E7EB',
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.6rem',
                              fontWeight: '500',
                              borderRadius: '6px'
                            }}
                          >
                            <i className="bi bi-tag-fill me-1"></i>
                            {tag}
                          </span>
                        ))}
                        {blog.tags.length > 3 && (
                          <span 
                            className="badge"
                            style={{
                              backgroundColor: '#F8F6F1',
                              color: '#6B7B5F',
                              border: '1px solid #E5E7EB',
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.6rem'
                            }}
                          >
                            +{blog.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div 
                      className="d-flex justify-content-between align-items-center pt-3 mt-auto"
                      style={{ 
                        borderTop: '1px solid #E5E7EB',
                        fontSize: '0.85rem',
                        color: '#6B7B5F'
                      }}
                    >
                      <div>
                        <i className="bi bi-calendar3 me-1"></i>
                        {formatDate(blog.published_at || blog.created_at)}
                      </div>
                      <div>
                        <i className="bi bi-clock me-1"></i>
                        {getReadingTime(blog.content)}
                      </div>
                    </div>
                  </div>

                  {/* Read More Footer */}
                  <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                    <button 
                      className="btn w-100 fw-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlogClick(blog);
                      }}
                      style={{
                        backgroundColor: '#2C5F2D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.6rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1e4620';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2C5F2D';
                      }}
                    >
                      Read Full Article
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        {filteredBlogs.length > 0 && (
          <div className="d-flex justify-content-center mt-5">
            <nav>
              <ul className="pagination">
                <li className="page-item disabled">
                  <a 
                    className="page-link" 
                    href="#" 
                    tabIndex="-1"
                    style={{
                      color: '#6B7B5F',
                      borderColor: '#E5E7EB',
                      borderRadius: '8px 0 0 8px'
                    }}
                  >
                    Previous
                  </a>
                </li>
                <li className="page-item active">
                  <a 
                    className="page-link" 
                    href="#"
                    style={{
                      backgroundColor: '#2C5F2D',
                      borderColor: '#2C5F2D'
                    }}
                  >
                    1
                  </a>
                </li>
                <li className="page-item disabled">
                  <a 
                    className="page-link" 
                    href="#"
                    style={{
                      color: '#6B7B5F',
                      borderColor: '#E5E7EB',
                      borderRadius: '0 8px 8px 0'
                    }}
                  >
                    Next
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>


      {/* Blog Detail Modal */}
      {showModal && selectedBlog && (
        <div 
          className="modal fade show d-block" 
          style={{ 
            backgroundColor: 'rgba(44, 95, 45, 0.4)',
            backdropFilter: 'blur(4px)'
          }}
          tabIndex="-1"
          onClick={handleCloseModal}
        >
          <div 
            className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-content border-0 shadow-lg"
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF'
              }}
            >
              {/* Modal Header */}
              <div 
                className="modal-header border-0"
                style={{
                  backgroundColor: '#F8F6F1',
                  padding: '1.5rem 2rem'
                }}
              >
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModal}
                  aria-label="Close"
                  style={{ filter: 'brightness(0.7)' }}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body px-5 py-4">
                {/* Category Badge */}
                {selectedBlog.category && (
                  <div className="mb-3">
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: '#E8F5E9',
                        color: '#2C5F2D',
                        fontSize: '0.9rem',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedBlog.category}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className="display-5 fw-bold mb-4" style={{ color: '#2C5F2D' }}>
                  {selectedBlog.title}
                </h1>

                {/* Meta Information */}
                <div 
                  className="d-flex flex-wrap gap-4 mb-4 pb-4"
                  style={{ 
                    borderBottom: '2px solid #E5E7EB',
                    color: '#6B7B5F'
                  }}
                >
                  <div>
                    <i className="bi bi-calendar3 me-2"></i>
                    {formatDate(selectedBlog.published_at || selectedBlog.created_at)}
                  </div>
                  
                  <div>
                    <i className="bi bi-clock me-2"></i>
                    {getReadingTime(selectedBlog.content)}
                  </div>
                </div>

                {/* Featured Image */}
                {selectedBlog.featured_image_url && (
                  <div className="mb-4">
                    <img
                      src={(() => {
                        try {
                          const parsed = JSON.parse(selectedBlog.featured_image_url);
                          return parsed.image_url?.replace(/\/$/, '') || selectedBlog.featured_image_url;
                        } catch {
                          return selectedBlog.featured_image_url?.replace(/\/$/, '') || '';
                        }
                      })()}
                      alt={selectedBlog.title}
                      className="img-fluid rounded shadow-sm w-100"
                      style={{ 
                        maxHeight: '500px', 
                        objectFit: 'cover',
                        borderRadius: '16px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Excerpt */}
                {selectedBlog.excerpt && (
                  <div 
                    className="alert border-0 mb-4" 
                    role="alert"
                    style={{
                      backgroundColor: '#F8F6F1',
                      borderLeft: '4px solid #2C5F2D',
                      borderRadius: '12px',
                      padding: '1.5rem'
                    }}
                  >
                    <p className="lead mb-0 fst-italic" style={{ color: '#6B7B5F' }}>
                      {selectedBlog.excerpt}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div 
                  className="blog-content mb-4"
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: '#2C5F2D',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedBlog.content}
                </div>

                {/* Tags */}
                {Array.isArray(selectedBlog.tags) && selectedBlog.tags.length > 0 && (
                  <div className="mt-5 pt-4" style={{ borderTop: '2px solid #E5E7EB' }}>
                    <h6 className="mb-3 fw-bold" style={{ color: '#2C5F2D' }}>
                      <i className="bi bi-tags-fill me-2"></i>
                      Tags
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedBlog.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="badge"
                          style={{
                            backgroundColor: '#E8F5E9',
                            color: '#2C5F2D',
                            fontSize: '0.9rem',
                            padding: '0.6rem 1rem',
                            borderRadius: '10px',
                            fontWeight: '600'
                          }}
                        >
                          <i className="bi bi-tag-fill me-2"></i>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div 
                className="modal-footer border-0"
                style={{
                  backgroundColor: '#F8F6F1',
                  padding: '1.25rem 2rem'
                }}
              >
                <button 
                  type="button" 
                  className="btn fw-semibold"
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: '#2C5F2D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsPage;