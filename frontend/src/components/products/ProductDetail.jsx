import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import contentService from '../../services/contentService';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import CartService from '../../services/cartService';
import LoginModal from '../auth/LoginModal';
import ProductChatbot from '../ProductChatbot.jsx';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [plantGuides, setPlantGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  useEffect(() => {
    if (product && product.slug) {
      fetchRelatedPlantGuides(product.slug);
    }
  }, [product]);

  useEffect(() => {
    if (product && product.id) {
      fetchProductReviews(product.id);
    }
  }, [product]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductBySlug(slug);
        console.log('Product detail response:', response);
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        setError(response.data.message || 'Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPlantGuides = async (productSlug) => {
    try {
      setGuidesLoading(true);
      const response = await contentService.listPlantGuidesUser();
      
      const allGuides = response.guides || response.data || [];
      
      const matchedGuides = allGuides.filter(guide => {
        if (!guide.is_published) return false;
        
        const guideSlug = guide.slug?.toLowerCase() || '';
        const guidePlantType = guide.plant_type?.toLowerCase() || '';
        const productSlugLower = productSlug.toLowerCase();
        const productName = product?.name?.toLowerCase() || '';
        
        return guideSlug.includes(productSlugLower) || 
               productSlugLower.includes(guideSlug) ||
               guidePlantType.includes(productSlugLower) ||
               guidePlantType.includes(productName) ||
               productName.includes(guidePlantType);
      });
      
      setPlantGuides(matchedGuides);
    } catch (err) {
      console.error('Error fetching plant guides:', err);
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleGuideClick = (guide) => {
    setSelectedGuide(guide);
    setShowGuideModal(true);
  };

  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedGuide(null);
  };

  const getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fetchProductReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const response = await reviewService.getProductReviews(productId);
      setReviews(response.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleWriteReview = async () => {
    if (!authService.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }

    setShowReviewModal(true);
    setReviewError('');
    setReviewSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewFormData.rating || !reviewFormData.comment.trim()) {
      setReviewError('Please provide a rating and comment');
      return;
    }

    try {
      setReviewError('');
      const response = await reviewService.addReview(product.id, reviewFormData);
      
      if (response.success) {
        setReviewSuccess('Review submitted successfully!');
        setReviewFormData({ rating: 5, title: '', comment: '' });
        
        fetchProductReviews(product.id);
        
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      
      if (err.response) {
        setReviewError(err.response.data.message || 'Failed to submit review');
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewFormData({ rating: 5, title: '', comment: '' });
    setReviewError('');
    setReviewSuccess('');
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi bi-star${star <= rating ? '-fill' : ''}`}
            style={{ 
              fontSize: interactive ? '1.5rem' : '1rem',
              cursor: interactive ? 'pointer' : 'default',
              color: '#FFB84D'
            }}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          ></i>
        ))}
      </div>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
   
    if (quantity < (product.max_order_quantity || 100) && quantity < product.stock_quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const maxQty = Math.min(product.stock_quantity, product.max_order_quantity || 100);
    
    if (value >= 1 && value <= maxQty) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!authService.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await CartService.addToCart(product.id, quantity);
      if (response.success) {
        setQuantity(1);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border" style={{ color: '#2C5F2D' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: '#6B7B5F' }}>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="alert border-0" style={{ backgroundColor: '#FFF5F5', color: '#C53030' }}>
            <h4>Error</h4>
            <p>{error || 'Product not found'}</p>
            <button 
              className="btn"
              style={{ backgroundColor: '#2C5F2D', color: '#FFFFFF' }}
              onClick={() => navigate('/products')}
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const careGuideText = (plantGuides || [])
    .map(g => `${g.title ? `${g.title}\n` : ''}${g.content || g.excerpt || ''}`)
    .join('\n\n');
  const reviewsText = (reviews || [])
    .map(r => {
      const name = r?.users?.profiles?.first_name || 'User';
      const title = r?.title ? ` - ${r.title}` : '';
      return `Rating: ${r.rating || 0}/5${title}\n${r.comment || ''}\nBy: ${name}`;
    })
    .join('\n---\n');

 const images = product.product_images && product.product_images.length > 0
  ? product.product_images.map(img => {
      try {
        const parsed = JSON.parse(img.image_url);
        return {
          ...img,
          image_url: parsed.image_url.replace(/\/$/, ''),
          alt_text: parsed.alt_text || product.name
        };
      } catch (error) {
        return {
          ...img,
          image_url: img.image_url?.replace(/\/$/, '') || '',
          alt_text: product.name
        };
      }
    })
  : [{
      image_url: product.primary_image?.replace(/\/$/, ''),
      alt_text: product.name
    }];

    console.log('Product images:', images);

  return (
    <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh', paddingBottom: '3rem' }}>
      <div className="container py-5">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb" style={{ backgroundColor: 'transparent' }}>
            <li className="breadcrumb-item">
              <a href="/" style={{ color: '#2C5F2D', textDecoration: 'none' }}>Home</a>
            </li>
            <li className="breadcrumb-item">
              <a onClick={() => navigate('/products')} style={{ color: '#2C5F2D', textDecoration: 'none', cursor: 'pointer' }}>Products</a>
            </li>
            <li className="breadcrumb-item active" style={{ color: '#6B7B5F' }}>{product.name}</li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="row g-4 mb-5">
          {/* Image Gallery - Smaller */}
          <div className="col-lg-5">
            <div className="card border-0" style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(44, 95, 45, 0.08)',
              overflow: 'hidden'
            }}>
              <div className="card-body p-3">
                {/* Main Image */}
                <div className="mb-3 position-relative" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <img
                    src={images[selectedImage]?.image_url || 'https://via.placeholder.com/400x400'}
                    alt={images[selectedImage]?.alt_text || product.name}
                    className="img-fluid"
                    style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="position-absolute top-0 start-0 m-3 d-flex gap-2">
                    {discount > 0 && (
                      <span className="badge" style={{
                        backgroundColor: '#E85D75',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px'
                      }}>
                        {discount}% OFF
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="badge" style={{
                        backgroundColor: '#FFB84D',
                        color: '#2C5F2D',
                        fontSize: '0.85rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px'
                      }}>
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="d-flex gap-2 overflow-auto">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={img.image_url}
                        alt={img.alt_text || `${product.name} ${index + 1}`}
                        className={`${selectedImage === index ? 'border-3' : ''}`}
                        style={{ 
                          width: '70px', 
                          height: '70px', 
                          objectFit: 'cover',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          border: selectedImage === index ? '3px solid #2C5F2D' : '2px solid #E5E7EB'
                        }}
                        onClick={() => setSelectedImage(index)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/70x70';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="col-lg-7">
            <div className="card border-0 h-100" style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(44, 95, 45, 0.08)',
              padding: '2rem'
            }}>
              {/* Product Name */}
              <h1 className="mb-2" style={{
                color: '#2C5F2D',
                fontSize: '2rem',
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}>
                {product.name}
              </h1>
              
              {/* Botanical Name */}
              {product.botanical_name && (
                <p className="fst-italic mb-3" style={{
                  color: '#6B7B5F',
                  fontSize: '1.1rem'
                }}>
                  {product.botanical_name}
                </p>
              )}

              {/* Stock Status */}
              <div className="mb-3">
                {isOutOfStock ? (
                  <span className="badge" style={{
                    backgroundColor: '#E5E7EB',
                    color: '#6B7280',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px'
                  }}>
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="badge" style={{
                    backgroundColor: '#FFF3CD',
                    color: '#856404',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px'
                  }}>
                    Only {product.stock_quantity} left in stock!
                  </span>
                ) : (
                  <span className="badge" style={{
                    backgroundColor: '#D4EDDA',
                    color: '#155724',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px'
                  }}>
                    In Stock
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-3">
                  <h2 className="mb-0" style={{
                    color: '#2C5F2D',
                    fontSize: '2.5rem',
                    fontWeight: '700'
                  }}>
                    ₹{parseFloat(product.price).toFixed(2)}
                  </h2>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <h4 className="text-decoration-line-through mb-0" style={{
                      color: '#9CA3AF',
                      fontSize: '1.5rem'
                    }}>
                      ₹{parseFloat(product.compare_at_price).toFixed(2)}
                    </h4>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="mb-4" style={{
                  color: '#6B7B5F',
                  fontSize: '1.05rem',
                  lineHeight: '1.6'
                }}>
                  {product.short_description}
                </p>
              )}

              {/* Quantity & Add to Cart */}
              {!isOutOfStock && (
                <div className="mb-4">
                  <label className="form-label mb-2" style={{
                    color: '#2C5F2D',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>
                    Quantity:
                  </label>
                  <div className="d-flex gap-3 align-items-center">
                    <div className="input-group" style={{ maxWidth: '140px' }}>
                      <button
                        className="btn"
                        type="button"
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          color: '#2C5F2D',
                          borderRadius: '10px 0 0 10px'
                        }}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={Math.min(product.stock_quantity, product.max_order_quantity || 100)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #E5E7EB',
                          borderLeft: 'none',
                          borderRight: 'none',
                          color: '#2C5F2D',
                          fontWeight: '600'
                        }}
                      />
                      <button
                        className="btn"
                        type="button"
                        onClick={handleIncrement}
                        disabled={quantity >= product.stock_quantity || quantity >= (product.max_order_quantity || 100)}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          color: '#2C5F2D',
                          borderRadius: '0 10px 10px 0'
                        }}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                    <button
                      className="btn flex-grow-1"
                      onClick={handleAddToCart}
                      style={{
                        backgroundColor: '#2C5F2D',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        fontWeight: '600',
                        fontSize: '1rem'
                      }}
                    >
                      <i className="bi bi-cart-plus me-2"></i>
                      Add to Cart
                    </button>
                  </div>
                  {product.max_order_quantity && (
                    <small style={{ color: '#6B7B5F', marginTop: '0.5rem', display: 'block' }}>
                      Maximum order quantity: {product.max_order_quantity}
                    </small>
                  )}
                </div>
              )}

              {/* Plant Details */}
              <div className="p-4 mb-4" style={{
                backgroundColor: '#F8F6F1',
                borderRadius: '12px'
              }}>
                <h5 className="mb-3" style={{
                  color: '#2C5F2D',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  <i className="bi bi-info-circle me-2"></i>Plant Information
                </h5>
                <div className="row g-3">
                  {product.care_level && (
                    <div className="col-6">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>Care Level:</strong>
                      <br />
                      <span className="badge mt-1" style={{
                        backgroundColor: product.care_level === 'easy' ? '#D4EDDA' :
                                       product.care_level === 'moderate' ? '#FFF3CD' : '#F8D7DA',
                        color: product.care_level === 'easy' ? '#155724' :
                               product.care_level === 'moderate' ? '#856404' : '#721C24',
                        fontSize: '0.85rem',
                        padding: '0.4rem 0.75rem'
                      }}>
                        {product.care_level.charAt(0).toUpperCase() + product.care_level.slice(1)}
                      </span>
                    </div>
                  )}
                  {product.pet_friendly !== null && (
                    <div className="col-6">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>Pet Friendly:</strong>
                      <br />
                      <span className="badge mt-1" style={{
                        backgroundColor: product.pet_friendly ? '#D4EDDA' : '#F8D7DA',
                        color: product.pet_friendly ? '#155724' : '#721C24',
                        fontSize: '0.85rem',
                        padding: '0.4rem 0.75rem'
                      }}>
                        {product.pet_friendly ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {product.light_requirement && (
                    <div className="col-6">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                        <i className="bi bi-sun me-1" style={{ color: '#FFB84D' }}></i>Light:
                      </strong>
                      <br />
                      <span style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>{product.light_requirement}</span>
                    </div>
                  )}
                  {product.water_requirement && (
                    <div className="col-6">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                        <i className="bi bi-droplet me-1" style={{ color: '#5BA3D0' }}></i>Water:
                      </strong>
                      <br />
                      <span style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>{product.water_requirement}</span>
                    </div>
                  )}
                  {product.growth_rate && (
                    <div className="col-6">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                        <i className="bi bi-graph-up me-1"></i>Growth Rate:
                      </strong>
                      <br />
                      <span style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>{product.growth_rate}</span>
                    </div>
                  )}
                  {product.mature_size && (
                    <div className="col-6">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                        <i className="bi bi-rulers me-1"></i>Mature Size:
                      </strong>
                      <br />
                      <span style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>{product.mature_size}</span>
                    </div>
                  )}
                  {product.plant_type && (
                    <div className="col-12">
                      <strong style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                        <i className="bi bi-flower1 me-1"></i>Plant Type:
                      </strong>
                      <br />
                      <span style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>{product.plant_type}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h5 className="mb-3" style={{
                    color: '#2C5F2D',
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}>
                    <i className="bi bi-file-text me-2"></i>Description
                  </h5>
                  <p style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.7',
                    color: '#6B7B5F',
                    fontSize: '0.95rem'
                  }}>
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plant Care Guides */}
        {plantGuides.length > 0 && (
          <div className="mb-5">
            <div className="card border-0" style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(44, 95, 45, 0.08)',
              padding: '2rem'
            }}>
              <h3 className="mb-3" style={{
                color: '#2C5F2D',
                fontWeight: '700',
                fontSize: '1.75rem'
              }}>
                <i className="bi bi-book me-2" style={{ color: '#97C97D' }}></i>
                Plant Care Guides
              </h3>
              <p className="mb-4" style={{ color: '#6B7B5F', fontSize: '1rem' }}>
                Learn how to take care of your {product.name} with these comprehensive guides
              </p>

              {guidesLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" style={{ color: '#2C5F2D' }} role="status">
                    <span className="visually-hidden">Loading guides...</span>
                  </div>
                </div>
              ) : (
                <div className="row g-4">
                  {plantGuides.map((guide) => (
                    <div key={guide.id} className="col-md-6 col-lg-4">
                      <div 
                        className="card h-100 border-0"
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          backgroundColor: '#F8F6F1',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}
                        onClick={() => handleGuideClick(guide)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 95, 45, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {guide.featured_image_url && (
                          <img
                            src={(() => {
                              try {
                                const parsed = JSON.parse(guide.featured_image_url);
                                return parsed.image_url?.replace(/\/$/, '') || guide.featured_image_url;
                              } catch {
                                return guide.featured_image_url?.replace(/\/$/, '') || '';
                              }
                            })()}
                            className="card-img-top"
                            alt={guide.title}
                            style={{ height: '180px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}

                        <div className="card-body">
                          {guide.difficulty_level && (
                            <div className="mb-2">
                              <span className="badge" style={{
                                backgroundColor: guide.difficulty_level === 'beginner' ? '#D4EDDA' :
                                               guide.difficulty_level === 'intermediate' ? '#FFF3CD' : '#F8D7DA',
                                color: guide.difficulty_level === 'beginner' ? '#155724' :
                                       guide.difficulty_level === 'intermediate' ? '#856404' : '#721C24',
                                fontSize: '0.75rem',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px'
                              }}>
                                {guide.difficulty_level.charAt(0).toUpperCase() + guide.difficulty_level.slice(1)}
                              </span>
                            </div>
                          )}

                          <h5 className="card-title mb-2" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: '#2C5F2D',
                            fontWeight: '600',
                            fontSize: '1.1rem'
                          }}>
                            {guide.title}
                          </h5>

                          {guide.excerpt && (
                            <p className="card-text small mb-3" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              color: '#6B7B5F',
                              fontSize: '0.9rem'
                            }}>
                              {guide.excerpt}
                            </p>
                          )}

                          {Array.isArray(guide.tags) && guide.tags.length > 0 && (
                            <div className="mb-2">
                              {guide.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="badge me-1" style={{
                                  backgroundColor: '#E3F2FD',
                                  color: '#1565C0',
                                  fontSize: '0.7rem',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px'
                                }}>
                                  <i className="bi bi-tag-fill me-1"></i>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <span style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                              <i className="bi bi-clock me-1"></i>
                              {getReadingTime(guide.content)}
                            </span>
                            <button className="btn btn-sm" style={{
                              backgroundColor: '#2C5F2D',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.85rem'
                            }}>
                              <i className="bi bi-book-half me-1"></i>
                              Read
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-5">
          <div className="card border-0" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(44, 95, 45, 0.08)',
            padding: '2rem'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0" style={{
                color: '#2C5F2D',
                fontWeight: '700',
                fontSize: '1.75rem'
              }}>
                <i className="bi bi-star-fill me-2" style={{ color: '#FFB84D' }}></i>
                Customer Reviews
              </h3>
              <button 
                className="btn"
                onClick={handleWriteReview}
                style={{
                  backgroundColor: '#2C5F2D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: '600'
                }}
              >
                <i className="bi bi-pencil-square me-2"></i>
                Write a Review
              </button>
            </div>

            {reviewsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border" style={{ color: '#FFB84D' }} role="status">
                  <span className="visually-hidden">Loading reviews...</span>
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-chat-left-text display-1 mb-3 d-block" style={{ color: '#E5E7EB' }}></i>
                <h5 className="mb-2" style={{ color: '#6B7B5F' }}>No Reviews Yet</h5>
                <p style={{ color: '#9CA3AF' }}>Be the first to review this product!</p>
              </div>
            ) : (
              <>
                {/* Rating Summary */}
                <div className="row mb-4 pb-4" style={{ borderBottom: '2px solid #F8F6F1' }}>
                  <div className="col-md-4 text-center">
                    <div className="display-3 fw-bold mb-2" style={{ color: '#FFB84D' }}>
                      {calculateAverageRating()}
                    </div>
                    {renderStars(Math.round(calculateAverageRating()))}
                    <p className="mt-2" style={{ color: '#6B7B5F' }}>Based on {reviews.length} reviews</p>
                  </div>
                  <div className="col-md-8">
                    {Object.entries(getRatingDistribution()).reverse().map(([rating, count]) => (
                      <div key={rating} className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ width: '60px', color: '#2C5F2D', fontWeight: '500' }}>
                          {rating} <i className="bi bi-star-fill" style={{ color: '#FFB84D' }}></i>
                        </span>
                        <div className="progress flex-grow-1" style={{ height: '20px', backgroundColor: '#F8F6F1' }}>
                          <div
                            className="progress-bar"
                            style={{ 
                              width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`,
                              backgroundColor: '#FFB84D'
                            }}
                          ></div>
                        </div>
                        <span className="ms-2" style={{ width: '50px', color: '#6B7B5F' }}>
                          ({count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="row g-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="col-12">
                      <div className="card border-0" style={{
                        backgroundColor: '#F8F6F1',
                        borderRadius: '12px',
                        padding: '1.5rem'
                      }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '50px', 
                                height: '50px', 
                                fontSize: '1.5rem',
                                backgroundColor: '#2C5F2D',
                                color: '#FFFFFF'
                              }}>
                              {review.users.profiles.first_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <h6 className="mb-1" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                                {review.users.profiles.first_name || 'Anonymous'}
                              </h6>
                              {renderStars(review.rating)}
                              {review.is_verified_purchase && (
                                <span className="badge mt-1" style={{
                                  backgroundColor: '#D4EDDA',
                                  color: '#155724',
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px'
                                }}>
                                  <i className="bi bi-check-circle me-1"></i>
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {review.title && (
                          <h6 className="fw-bold mb-2" style={{ color: '#2C5F2D' }}>{review.title}</h6>
                        )}
                        
                        <p className="mb-0" style={{ 
                          whiteSpace: 'pre-wrap',
                          color: '#6B7B5F',
                          lineHeight: '1.6'
                        }}>
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-4">
          <button 
            className="btn"
            onClick={() => navigate('/products')}
            style={{
              backgroundColor: 'transparent',
              color: '#2C5F2D',
              border: '2px solid #2C5F2D',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontWeight: '600'
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Products
          </button>
        </div>

        {/* Login Modal */}
        <LoginModal
          show={showLoginModal}
          onHide={() => setShowLoginModal(false)}
        />

        {/* Write Review Modal */}
        {showReviewModal && (
          <div 
            className="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(44, 95, 45, 0.75)' }}
            tabIndex="-1"
            onClick={handleCloseReviewModal}
          >
            <div 
              className="modal-dialog modal-lg modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                {/* Modal Header */}
                <div className="modal-header" style={{
                  backgroundColor: '#2C5F2D',
                  color: '#FFFFFF',
                  borderBottom: 'none',
                  padding: '1.5rem'
                }}>
                  <h5 className="modal-title" style={{ fontWeight: '600', fontSize: '1.25rem' }}>
                    <i className="bi bi-pencil-square me-2"></i>
                    Write a Review for {product.name}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={handleCloseReviewModal}
                  ></button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleReviewSubmit}>
                  <div className="modal-body" style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}>
                    {/* Error Message */}
                    {reviewError && (
                      <div className="alert border-0 mb-3" role="alert" style={{
                        backgroundColor: '#FFF5F5',
                        color: '#C53030',
                        borderRadius: '10px'
                      }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {reviewError}
                      </div>
                    )}

                    {/* Success Message */}
                    {reviewSuccess && (
                      <div className="alert border-0 mb-3" role="alert" style={{
                        backgroundColor: '#D4EDDA',
                        color: '#155724',
                        borderRadius: '10px'
                      }}>
                        <i className="bi bi-check-circle me-2"></i>
                        {reviewSuccess}
                      </div>
                    )}

                    {/* Rating */}
                    <div className="mb-4">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                        Rating <span style={{ color: '#E85D75' }}>*</span>
                      </label>
                      <div>
                        {renderStars(reviewFormData.rating, true, (rating) => 
                          setReviewFormData(prev => ({ ...prev, rating }))
                        )}
                        <small className="d-block mt-2" style={{ color: '#6B7B5F' }}>
                          Click on a star to rate (1 = Poor, 5 = Excellent)
                        </small>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                        Review Title <small style={{ color: '#6B7B5F' }}>(Optional)</small>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Summarize your experience"
                        value={reviewFormData.title}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, title: e.target.value }))}
                        maxLength="100"
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          color: '#2C5F2D'
                        }}
                      />
                      <small style={{ color: '#6B7B5F' }}>
                        {reviewFormData.title.length}/100 characters
                      </small>
                    </div>

                    {/* Comment */}
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                        Your Review <span style={{ color: '#E85D75' }}>*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Share your experience with this product..."
                        value={reviewFormData.comment}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                        required
                        style={{
                          resize: 'vertical',
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          color: '#2C5F2D'
                        }}
                      ></textarea>
                      <small style={{ color: '#6B7B5F' }}>
                        Minimum 10 characters. Be honest and helpful to other customers.
                      </small>
                    </div>

                    {/* Info Box */}
                    <div className="alert border-0" role="alert" style={{
                      backgroundColor: '#E3F2FD',
                      color: '#1565C0',
                      borderRadius: '10px'
                    }}>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Note:</strong> You can only review products that you have purchased and received.
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer" style={{
                    backgroundColor: '#F8F6F1',
                    borderTop: 'none',
                    padding: '1.25rem 2rem'
                  }}>
                    <button 
                      type="button" 
                      className="btn"
                      onClick={handleCloseReviewModal}
                      style={{
                        backgroundColor: '#E5E7EB',
                        color: '#6B7280',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.65rem 1.25rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn"
                      disabled={!reviewFormData.comment.trim() || reviewFormData.comment.length < 10}
                      style={{
                        backgroundColor: '#2C5F2D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.65rem 1.25rem',
                        fontWeight: '600',
                        opacity: (!reviewFormData.comment.trim() || reviewFormData.comment.length < 10) ? 0.6 : 1
                      }}
                    >
                      <i className="bi bi-send me-2"></i>
                      Submit Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Plant Guide Modal */}
        {showGuideModal && selectedGuide && (
          <div 
            className="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(44, 95, 45, 0.75)' }}
            tabIndex="-1"
            onClick={handleCloseGuideModal}
          >
            <div 
              className="modal-dialog modal-xl modal-dialog-scrollable"
              style={{ maxHeight: '90vh', marginTop: '5vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                {/* Modal Header */}
                <div className="modal-header" style={{
                  backgroundColor: '#FFFFFF',
                  borderBottom: 'none',
                  padding: '1.5rem 2rem'
                }}>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={handleCloseGuideModal}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body" style={{ padding: '0 3rem 2rem 3rem', backgroundColor: '#FFFFFF' }}>
                  {/* Difficulty Badge */}
                  {selectedGuide.difficulty_level && (
                    <div className="mb-3">
                      <span className="badge" style={{
                        backgroundColor: selectedGuide.difficulty_level === 'beginner' ? '#D4EDDA' :
                                       selectedGuide.difficulty_level === 'intermediate' ? '#FFF3CD' : '#F8D7DA',
                        color: selectedGuide.difficulty_level === 'beginner' ? '#155724' :
                               selectedGuide.difficulty_level === 'intermediate' ? '#856404' : '#721C24',
                        fontSize: '0.9rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px'
                      }}>
                        {selectedGuide.difficulty_level.charAt(0).toUpperCase() + selectedGuide.difficulty_level.slice(1)} Level
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="display-5 fw-bold mb-3" style={{ color: '#2C5F2D' }}>{selectedGuide.title}</h1>

                  {/* Plant Type */}
                  {selectedGuide.plant_type && (
                    <div className="mb-3">
                      <span className="badge" style={{
                        backgroundColor: '#97C97D',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px'
                      }}>
                        <i className="bi bi-flower1 me-2"></i>
                        {selectedGuide.plant_type}
                      </span>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="d-flex flex-wrap gap-4 mb-4 pb-4" style={{ borderBottom: '2px solid #F8F6F1', color: '#6B7B5F' }}>
                    <div>
                      <i className="bi bi-calendar3 me-2"></i>
                      {formatDate(selectedGuide.published_at || selectedGuide.created_at)}
                    </div>
                    <div>
                      <i className="bi bi-clock me-2"></i>
                      {getReadingTime(selectedGuide.content)}
                    </div>
                  </div>

                  {/* Featured Image */}
                  {selectedGuide.featured_image_url && (
                    <div className="mb-4">
                      <img
                        src={(() => {
                          try {
                            const parsed = JSON.parse(selectedGuide.featured_image_url);
                            return parsed.image_url?.replace(/\/$/, '') || selectedGuide.featured_image_url;
                          } catch {
                            return selectedGuide.featured_image_url?.replace(/\/$/, '') || '';
                          }
                        })()}
                        alt={selectedGuide.title}
                        className="img-fluid w-100"
                        style={{ 
                          maxHeight: '500px', 
                          objectFit: 'cover',
                          borderRadius: '12px',
                          boxShadow: '0 4px 16px rgba(44, 95, 45, 0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Excerpt */}
                  {selectedGuide.excerpt && (
                    <div className="alert border-0 mb-4" role="alert" style={{
                      backgroundColor: '#F8F6F1',
                      borderLeft: '4px solid #97C97D',
                      borderRadius: '10px',
                      padding: '1.25rem'
                    }}>
                      <p className="lead mb-0 fst-italic" style={{ color: '#2C5F2D' }}>
                        <i className="bi bi-lightbulb me-2" style={{ color: '#FFB84D' }}></i>
                        {selectedGuide.excerpt}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div 
                    className="guide-content mb-4"
                    style={{
                      fontSize: '1.05rem',
                      lineHeight: '1.8',
                      color: '#4A5568',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {selectedGuide.content}
                  </div>

                  {/* Tags */}
                  {Array.isArray(selectedGuide.tags) && selectedGuide.tags.length > 0 && (
                    <div className="mt-5 pt-4" style={{ borderTop: '2px solid #F8F6F1' }}>
                      <h6 className="mb-3" style={{ color: '#6B7B5F' }}>
                        <i className="bi bi-tags me-2"></i>
                        Tags
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedGuide.tags.map((tag, idx) => (
                          <span key={idx} className="badge" style={{
                            backgroundColor: '#E3F2FD',
                            color: '#1565C0',
                            fontSize: '0.9rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px'
                          }}>
                            <i className="bi bi-tag-fill me-1"></i>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Product */}
                  <div className="mt-4 p-3" style={{
                    backgroundColor: '#F8F6F1',
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <i className="bi bi-info-circle me-2" style={{ color: '#2C5F2D' }}></i>
                        <strong style={{ color: '#2C5F2D' }}>This guide is for: {product.name}</strong>
                      </div>
                      <button 
                        className="btn btn-sm"
                        onClick={handleCloseGuideModal}
                        style={{
                          backgroundColor: '#2C5F2D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        View Product
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer" style={{
                  backgroundColor: '#F8F6F1',
                  borderTop: 'none',
                  padding: '1.25rem 2rem'
                }}>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={handleCloseGuideModal}
                    style={{
                      backgroundColor: '#E5E7EB',
                      color: '#6B7280',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.65rem 1.25rem',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chatbot */}
        <ProductChatbot
          plantName={product?.name || ''}
          plantDescription={product?.description || product?.short_description || ''}
          careGuideText={careGuideText}
          reviewsText={reviewsText}
        />
      </div>
    </div>
  );
};

export default ProductDetail;