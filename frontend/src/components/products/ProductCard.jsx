import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CartService from '../../services/cartService';
import LoginModal from '../auth/LoginModal';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Parse product images to handle Cloudinary URLs
  const parseProductImage = () => {
    // If product has multiple images
    if (product.product_images && product.product_images.length > 0) {
      const images = product.product_images.map(img => {
        try {
          // Try to parse if image_url is a JSON string
          const parsed = JSON.parse(img.image_url);
          return {
            ...img,
            image_url: parsed.image_url.replace(/\/$/, ''),
            alt_text: parsed.alt_text || product.name
          };
        } catch (error) {
          // If parsing fails, use the original URL
          return {
            ...img,
            image_url: img.image_url?.replace(/\/$/, '') || '',
            alt_text: product.name
          };
        }
      });
      return images[0]; // Return first image for the card
    }
    
    // Fallback to primary_image or image_url
    let imageUrl = product.primary_image || product.image_url || '';
    
    // Try to parse if it's a JSON string
    try {
      const parsed = JSON.parse(imageUrl);
      imageUrl = parsed.image_url.replace(/\/$/, '');
    } catch (error) {
      // If not JSON, just remove trailing slash
      imageUrl = imageUrl.replace(/\/$/, '');
    }
    
    return {
      image_url: imageUrl,
      alt_text: product.name
    };
  };

  const productImage = parseProductImage();

  const handleCardClick = () => {
    navigate(`/products/${product.slug}`);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (quantity < (product.max_order_quantity || 100) && quantity < product.stock_quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await CartService.addToCart(product.id, quantity);
      if (response.success) {
        setQuantity(1);
        setShowQuantitySelector(false);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/products/${product.slug}`);
  };

  const isOutOfStock = product.stock_quantity === 0;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;



  return (
    <div className="col">
      <div 
        className="card h-100 border-0 product-card position-relative" 
        style={{ 
          cursor: 'pointer', 
          transition: 'all 0.3s ease',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(44, 95, 45, 0.08)',
          overflow: 'hidden'
        }}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(44, 95, 45, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(44, 95, 45, 0.08)';
        }}
      >
        {/* Badges */}
        {product.is_featured && (
          <span 
            className="badge position-absolute top-0 start-0 m-3" 
            style={{ 
              zIndex: 1,
              backgroundColor: '#FFB84D',
              color: '#2C5F2D',
              fontWeight: '600',
              fontSize: '0.75rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Featured
          </span>
        )}
        
        {hasDiscount && (
          <span 
            className="badge position-absolute top-0 end-0 m-3" 
            style={{ 
              zIndex: 1,
              backgroundColor: '#E85D75',
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: '0.75rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px'
            }}
          >
            {discountPercent}% OFF
          </span>
        )}

        {/* Image Container */}
        <div style={{ 
          position: 'relative',
          backgroundColor: '#d5a837ff',
          overflow: 'hidden'
        }}>
          <img
            src={productImage.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
            className="card-img-top"
            alt={productImage.alt_text || product.name}
            style={{ 
              height: '280px', 
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        </div>
        
        <div className="card-body d-flex flex-column" style={{ padding: '1.5rem' }}>
          <h4 
            className="card-title text-truncate mb-2" 
            title={product.name}
            style={{
              fontWeight: '700',
             
              color: '#2C5F2D',
              letterSpacing: '-0.3px'
            }}
          >
            {product.name}
          </h4>
          
          {product.botanical_name && (
            <p className="mb-3" style={{
              fontSize: '0.85rem',
              color: '#6B7B5F',
              fontStyle: 'italic'
            }}>
              {product.botanical_name}
            </p>
          )}

          {/* Care Level & Pet Friendly Badges */}
          <div className="mb-3 d-flex flex-wrap gap-2">
            {product.care_level && (
              <span 
                className="badge"
                style={{
                  backgroundColor: product.care_level === 'easy' ? '#D4EDDA' :
                                 product.care_level === 'moderate' ? '#FFF3CD' : '#F8D7DA',
                  color: product.care_level === 'easy' ? '#155724' :
                         product.care_level === 'moderate' ? '#856404' : '#721C24',
                  fontWeight: '600',
                  fontSize: '0.7rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  textTransform: 'capitalize'
                }}
              >
               Care level: {product.care_level}
              </span>
            )}
            
            {product.pet_friendly && (
              <span 
                className="badge"
                style={{
                  backgroundColor: '#E3F2FD',
                  color: '#1565C0',
                  fontWeight: '600',
                  fontSize: '0.7rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px'
                }}
              >
                <i className="bi bi-heart-fill me-1"></i>Pet Friendly
              </span>
            )}
          </div>

          {/* Light & Water Requirements */}
          <div className="mb-3">
            {product.light_requirement && (
              <small className="d-block mb-1" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                <i className="bi bi-sun me-2" style={{ color: '#FFB84D' }}></i>
                <span style={{ fontWeight: '500' }}>Light:</span> {product.light_requirement}
              </small>
            )}
            
            {product.water_requirement && (
              <small className="d-block" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                <i className="bi bi-droplet me-2" style={{ color: '#5BA3D0' }}></i>
                <span style={{ fontWeight: '500' }}>Water:</span> {product.water_requirement}
              </small>
            )}
          </div>

          <div className="mt-auto">
            {/* Rating */}
            {product.avg_rating > 0 && (
              <div className="d-flex align-items-center mb-3">
                <div style={{ color: '#FFB84D', fontSize: '0.95rem' }}>
                  {'★'.repeat(Math.round(product.avg_rating))}
                  {'☆'.repeat(5 - Math.round(product.avg_rating))}
                  <small className="ms-2" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                    ({product.review_count})
                  </small>
                </div>
              </div>
            )}

            {/* Price Section */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0" style={{ 
                  color: '#2C5F2D', 
                  fontWeight: '700',
                  fontSize: '1.5rem' 
                }}>
                  ₹{parseFloat(product.price).toFixed(2)}
                </h5>
                {hasDiscount && (
                  <small 
                    className="text-decoration-line-through" 
                    style={{ color: '#9CA3AF', fontSize: '0.85rem' }}
                  >
                    ₹{parseFloat(product.compare_at_price).toFixed(2)}
                  </small>
                )}
              </div>
              
              <div>
                {isOutOfStock ? (
                  <span 
                    className="badge"
                    style={{
                      backgroundColor: '#E5E7EB',
                      color: '#6B7280',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px'
                    }}
                  >
                    Out of Stock
                  </span>
                ) : product.stock_quantity < 10 ? (
                  <small style={{ 
                    color: '#DC2626', 
                    fontWeight: '600',
                    fontSize: '0.8rem' 
                  }}>
                    Only {product.stock_quantity} left!
                  </small>
                ) : null}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2" onClick={(e) => e.stopPropagation()}>
              {!isOutOfStock && !showQuantitySelector ? (
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuantitySelector(true);
                  }}
                  style={{
                    backgroundColor: '#2C5F2D',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1F4520'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F2D'}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  Add to Cart
                </button>
              ) : !isOutOfStock && showQuantitySelector ? (
                <div className="d-flex gap-2">
                  <div className="input-group" style={{ maxWidth: '120px' }}>
                    <button
                      className="btn btn-sm"
                      type="button"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: '2px solid #E5E7EB',
                        color: '#2C5F2D',
                        borderRadius: '8px 0 0 8px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={quantity}
                      readOnly
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
                      className="btn btn-sm"
                      type="button"
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock_quantity || quantity >= (product.max_order_quantity || 100)}
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: '2px solid #E5E7EB',
                        color: '#2C5F2D',
                        borderRadius: '0 8px 8px 0',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <button
                    className="btn btn-sm flex-grow-1"
                    onClick={handleAddToCart}
                    disabled={loading}
                    style={{
                      backgroundColor: '#2C5F2D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ) : (
                <button 
                  className="btn" 
                  disabled
                  style={{
                    backgroundColor: '#E5E7EB',
                    color: '#6B7280',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}
                >
                  Out of Stock
                </button>
              )}
              
              <button 
                className="btn btn-sm"
                onClick={handleViewDetails}
                style={{
                  backgroundColor: 'transparent',
                  color: '#2C5F2D',
                  border: '2px solid #2C5F2D',
                  borderRadius: '10px',
                  fontWeight: '600',
                  padding: '0.65rem 1rem',
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
                <i className="bi bi-eye me-2"></i>
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default ProductCard;