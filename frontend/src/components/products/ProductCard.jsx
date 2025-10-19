import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProductCard = ({ product, onAddToCart }) => {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }
    onAddToCart(product);
  };

  const isOutOfStock = product.stock_quantity === 0;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="col">
      <div className="card h-100 shadow-sm border-0 product-card position-relative">
        {product.is_featured && (
          <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
            Featured
          </span>
        )}
        
        {hasDiscount && (
          <span className="badge bg-danger position-absolute top-0 end-0 m-2">
            {discountPercent}% OFF
          </span>
        )}

        <img
          src={product.primary_image || 'https://via.placeholder.com/300x300?text=Plant'}
          className="card-img-top"
          alt={product.name}
          style={{ height: '250px', objectFit: 'cover' }}
        />
        
        <div className="card-body d-flex flex-column">
          <h6 className="card-title text-truncate">{product.name}</h6>
          
          {product.botanical_name && (
            <p className="text-muted small mb-2">
              <em>{product.botanical_name}</em>
            </p>
          )}

          <div className="mb-2">
            {product.care_level && (
              <span className={`badge me-1 ${
                product.care_level === 'easy' ? 'bg-success' :
                product.care_level === 'moderate' ? 'bg-warning' : 'bg-danger'
              }`}>
                {product.care_level}
              </span>
            )}
            
            {product.pet_friendly && (
              <span className="badge bg-info">
                <i className="bi bi-heart-fill"></i> Pet Friendly
              </span>
            )}
          </div>

          <div className="mb-2">
            {product.light_requirement && (
              <small className="text-muted d-block">
                <i className="bi bi-sun me-1"></i>
                {product.light_requirement}
              </small>
            )}
            
            {product.water_requirement && (
              <small className="text-muted d-block">
                <i className="bi bi-droplet me-1"></i>
                {product.water_requirement}
              </small>
            )}
          </div>

          <div className="mt-auto">
            <div className="d-flex align-items-center mb-2">
              {product.avg_rating > 0 && (
                <div className="text-warning me-2">
                  {'★'.repeat(Math.round(product.avg_rating))}
                  {'☆'.repeat(5 - Math.round(product.avg_rating))}
                  <small className="text-muted ms-1">({product.review_count})</small>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="mb-0 text-success">₹{product.price}</h5>
                {hasDiscount && (
                  <small className="text-muted text-decoration-line-through">
                    ₹{product.compare_at_price}
                  </small>
                )}
              </div>
              
              <div>
                {isOutOfStock ? (
                  <span className="badge bg-secondary">Out of Stock</span>
                ) : product.stock_quantity < 10 ? (
                  <small className="text-danger">Only {product.stock_quantity} left!</small>
                ) : null}
              </div>
            </div>

            {showLoginPrompt && (
              <div className="alert alert-warning alert-dismissible fade show p-2 mb-2" role="alert">
                <small>Please login to add items to cart</small>
              </div>
            )}

            <div className="d-grid gap-2">
              <button
                className="btn btn-success"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <i className="bi bi-cart-plus me-2"></i>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button className="btn btn-outline-success btn-sm">
                <i className="bi bi-eye me-2"></i>
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;