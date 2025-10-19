import { useState, useEffect } from 'react';
import ProductGrid from '../components/products/ProductGrid';
import productService from '../services/productService';

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    careLevel: '',
    search: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await productService.getAllProducts(filters);
      if (response.success && response.items) {
        setProducts(response.items);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    // Cart functionality will be implemented in next step
    console.log('Adding to cart:', product);
    alert(`${product.name} added to cart!`);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSearch = () => {
    fetchProducts();
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section bg-success text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-4 fw-bold mb-3">
                Bring Nature Home
              </h1>
              <p className="lead mb-4">
                Discover our wide collection of healthy plants, delivered right to your doorstep.
                Transform your space into a green paradise.
              </p>
              <button className="btn btn-light btn-lg">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Shop Now
              </button>
            </div>
            <div className="col-md-6 text-center">
              <i className="bi bi-flower1 display-1"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-md-3">
              <div className="feature-box">
                <i className="bi bi-truck text-success display-4 mb-3"></i>
                <h5>Free Delivery</h5>
                <p className="text-muted small">On orders above ₹999</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-box">
                <i className="bi bi-shield-check text-success display-4 mb-3"></i>
                <h5>Quality Guaranteed</h5>
                <p className="text-muted small">Healthy & fresh plants</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-box">
                <i className="bi bi-headset text-success display-4 mb-3"></i>
                <h5>Expert Support</h5>
                <p className="text-muted small">Plant care assistance</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-box">
                <i className="bi bi-arrow-repeat text-success display-4 mb-3"></i>
                <h5>Easy Returns</h5>
                <p className="text-muted small">7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section py-5">
        <div className="container">
          <div className="row mb-4">
            <div className="col-md-8">
              <h2 className="fw-bold">Our Plant Collection</h2>
              <p className="text-muted">Explore our wide variety of indoor and outdoor plants</p>
            </div>
            <div className="col-md-4 text-end">
              <button className="btn btn-outline-success">
                View All
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small text-muted">Search</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search plants..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className="btn btn-success" onClick={handleSearch}>
                          <i className="bi bi-search"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label small text-muted">Category</label>
                      <select
                        className="form-select"
                        value={filters.category}
                        onChange={(e) => {
                          handleFilterChange('category', e.target.value);
                          handleSearch();
                        }}
                      >
                        <option value="">All Categories</option>
                        <option value="indoor">Indoor Plants</option>
                        <option value="outdoor">Outdoor Plants</option>
                        <option value="succulents">Succulents</option>
                        <option value="flowering">Flowering Plants</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small text-muted">Price Range</label>
                      <select
                        className="form-select"
                        value={filters.priceRange}
                        onChange={(e) => {
                          handleFilterChange('priceRange', e.target.value);
                          handleSearch();
                        }}
                      >
                        <option value="">All Prices</option>
                        <option value="0-500">Under ₹500</option>
                        <option value="500-1000">₹500 - ₹1000</option>
                        <option value="1000-2000">₹1000 - ₹2000</option>
                        <option value="2000+">Above ₹2000</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small text-muted">Care Level</label>
                      <select
                        className="form-select"
                        value={filters.careLevel}
                        onChange={(e) => {
                          handleFilterChange('careLevel', e.target.value);
                          handleSearch();
                        }}
                      >
                        <option value="">All Levels</option>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="difficult">Difficult</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Product Grid */}
          <ProductGrid
            products={products}
            loading={loading}
            onAddToCart={handleAddToCart}
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Shop by Category</h2>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card text-center shadow-sm h-100 border-0">
                <div className="card-body">
                  <i className="bi bi-house-door text-success display-3 mb-3"></i>
                  <h5 className="card-title">Indoor Plants</h5>
                  <p className="card-text text-muted small">Perfect for home decor</p>
                  <a href="/category/indoor" className="btn btn-outline-success btn-sm">
                    Browse
                  </a>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-center shadow-sm h-100 border-0">
                <div className="card-body">
                  <i className="bi bi-sun text-success display-3 mb-3"></i>
                  <h5 className="card-title">Outdoor Plants</h5>
                  <p className="card-text text-muted small">Garden essentials</p>
                  <a href="/category/outdoor" className="btn btn-outline-success btn-sm">
                    Browse
                  </a>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-center shadow-sm h-100 border-0">
                <div className="card-body">
                  <i className="bi bi-droplet text-success display-3 mb-3"></i>
                  <h5 className="card-title">Succulents</h5>
                  <p className="card-text text-muted small">Low maintenance plants</p>
                  <a href="/category/succulents" className="btn btn-outline-success btn-sm">
                    Browse
                  </a>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-center shadow-sm h-100 border-0">
                <div className="card-body">
                  <i className="bi bi-flower2 text-success display-3 mb-3"></i>
                  <h5 className="card-title">Flowering</h5>
                  <p className="card-text text-muted small">Colorful blooms</p>
                  <a href="/category/flowering" className="btn btn-outline-success btn-sm">
                    Browse
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section py-5 bg-success text-white">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <h3 className="fw-bold mb-3">Join Our Plant Community</h3>
              <p className="mb-4">
                Subscribe to our newsletter for exclusive offers and plant care tips
              </p>
              <form className="row g-2 justify-content-center">
                <div className="col-auto">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    style={{ width: '300px' }}
                  />
                </div>
                <div className="col-auto">
                  <button type="submit" className="btn btn-light">
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;