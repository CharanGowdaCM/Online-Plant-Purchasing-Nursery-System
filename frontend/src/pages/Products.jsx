// Developer: Charan Gowda CM
// Features: product display, category filter, search, price range, care level, product grid, data fetching


import { useState, useEffect } from 'react';
import ProductGrid from '../components/products/ProductGrid';
import productService from '../services/productService';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    priceRange: "",
    careLevel: "",
  });

  useEffect(() => {
    // initial load
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Debounce search input so API isn't called on every keystroke instantly
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms delay — adjust as needed

    return () => clearTimeout(delayDebounce);
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await productService.getCategories();
      const cats = res?.data?.data || res?.categories || [];
      const normalized = cats.map((c) => ({
        name: c.name || c.category_name || c.title || 'Category',
        slug: c.slug || c.category_slug || c.id || '',
      }));
      setCategories(normalized);
    } catch (e) {
      console.error('Failed to fetch categories', e);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Map priceRange to min/max for API
      let minPrice;
      let maxPrice;
      switch (filters.priceRange) {
        case '0-500':
          minPrice = 0; maxPrice = 500; break;
        case '500-1000':
          minPrice = 500; maxPrice = 1000; break;
        case '1000-2000':
          minPrice = 1000; maxPrice = 2000; break;
        case '2000+':
          minPrice = 2000; maxPrice = undefined; break;
        default:
          minPrice = undefined; maxPrice = undefined;
      }

      const params = {
        search: filters.search || '',
        category: filters.category || '',
        careLevel: filters.careLevel || '',
        minPrice,
        maxPrice,
        page: 1,
        // keep default limit from service (12) unless changed server-side
      };

      const response = await productService.getAllProducts(params);
      if (response.success && response.data) {
        setProducts(response.data);
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

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <div className="landing-page" style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
      <section className="products-section py-5">
        <div className="container">
          {/* Header Section */}
          <div className="row mb-5">
            <div className="col-md-12 text-center">
              <h2 className="fw-bold mb-2" style={{ 
                color: '#2C5F2D', 
                fontSize: '2.5rem',
                letterSpacing: '-0.5px'
              }}>
                Our Plant Collection
              </h2>
              <p className="mb-0" style={{ 
                color: '#6B7B5F', 
                fontSize: '1.1rem',
                fontWeight: '400'
              }}>
                Explore our wide variety of indoor and outdoor plants
              </p>
              <div style={{
                width: '80px',
                height: '3px',
                backgroundColor: '#97C97D',
                margin: '20px auto 0'
              }}></div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="row mb-5">
            <div className="col-md-12">
              <div className="card border-0" style={{
                backgroundColor: '#ffffffff',
                border: '10px solid #18892fff',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(44, 95, 45, 0.08)',
                overflow: 'hidden'
              }}>
                <div className="card-body p-4">
                  <div className="row g-4">
                    {/* Search */}
                    <div className="col-md-4">
                      <label className="form-label small mb-2" style={{ 
                        color: '#2C5F2D',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        Search
                      </label>
                      <div className="input-group">
                        <span className="input-group-text border-0" style={{
                          backgroundColor: '#F8F6F1',
                          color: '#6B7B5F'
                        }}>
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-0"
                          placeholder="Search plants..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          style={{
                            backgroundColor: '#F8F6F1',
                            color: '#2C5F2D',
                            fontSize: '0.95rem',
                            padding: '0.65rem 1rem'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Category */}
                    <div className="col-md-3">
                      <label className="form-label small mb-2" style={{ 
                        color: '#2C5F2D',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        Category
                      </label>
                      <select
                        className="form-select border-0"
                        value={filters.category}
                        onChange={(e) => {
                          handleFilterChange('category', e.target.value);
                        }}
                        style={{
                          backgroundColor: '#F8F6F1',
                          color: '#2C5F2D',
                          fontSize: '0.95rem',
                          padding: '0.65rem 1rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div className="col-md-3">
                      <label className="form-label small mb-2" style={{ 
                        color: '#2C5F2D',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        Price Range
                      </label>
                      <select
                        className="form-select border-0"
                        value={filters.priceRange}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleFilterChange('priceRange', value);
                          fetchProducts();
                        }}
                        style={{
                          backgroundColor: '#F8F6F1',
                          color: '#2C5F2D',
                          fontSize: '0.95rem',
                          padding: '0.65rem 1rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">All Prices</option>
                        <option value="0-500">Under ₹500</option>
                        <option value="500-1000">₹500 - ₹1000</option>
                        <option value="1000-2000">₹1000 - ₹2000</option>
                        <option value="2000+">Above ₹2000</option>
                      </select>
                    </div>

                    {/* Care Level */}
                    <div className="col-md-2">
                      <label className="form-label small mb-2" style={{ 
                        color: '#2C5F2D',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        Care Level
                      </label>
                      <select
                        className="form-select border-0"
                        value={filters.careLevel}
                        onChange={(e) => {
                          handleFilterChange('careLevel', e.target.value);
                        }}
                        style={{
                          backgroundColor: '#F8F6F1',
                          color: '#2C5F2D',
                          fontSize: '0.95rem',
                          padding: '0.65rem 1rem',
                          cursor: 'pointer'
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
            <div className="alert border-0 mb-4" role="alert" style={{
              backgroundColor: '#FFF5F5',
              color: '#C53030',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Product Grid */}
          <ProductGrid
            products={products}
            loading={loading}
          />
        </div>
      </section>

      <style jsx>{`
        .form-control:focus,
        .form-select:focus {
          box-shadow: 0 0 0 3px rgba(151, 201, 125, 0.15) !important;
          outline: none;
        }

        .form-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%232C5F2D' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
        }

        .card {
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(44, 95, 45, 0.12) !important;
        }

        .input-group-text {
          transition: all 0.2s ease;
        }

        .form-control:focus + .input-group-text,
        .input-group-text:has(+ .form-control:focus) {
          color: #2C5F2D;
        }
      `}</style>
    </div>
  );
};

export default Products;