/**
 * Developer: Charan Gowda C M
 * Features: Landing Page, Product Showcase, Blog Highlights, Carousel, Typing Animation, 
 * Filters, Product Fetching, Blog Fetching, Category List, Responsive Design, 
 * React Hooks, Navigation, Toast Notification, Session Handling
 */


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductGrid from '../components/products/ProductGrid';
import productService from '../services/productService';
import contentService from '../services/contentService';
import bleafLogo from '../assets/bleaf_logo-2.png';
// Import carousel images
import carouselImg1 from '../assets/Lakshya.jpg';
import carouselImg2 from '../assets/Charan.jpg';
import carouselImg3 from '../assets/Shiva_sai.jpeg';
import carouselImg4 from '../assets/Hemanth.jpeg';
import carouselImg5 from '../assets/Hemanth2.jpeg';

const LandingPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [lastLoginNotification, setLastLoginNotification] = useState(null);
  const [showLastLoginToast, setShowLastLoginToast] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [animationText, setAnimationText] = useState('');
  const [animationPhase, setAnimationPhase] = useState('blieve');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    priceRange: "",
    careLevel: "",
  });

  // Carousel images
  const carouselImages = [
    carouselImg1,
    carouselImg2,
    carouselImg3,
    carouselImg4,
    carouselImg5,
  ];

  // Text animation effect
   const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const words = ["Believe", "Bleaf"];
  const typingSpeed = 150;
  const deletingSpeed = 100;
  const pauseTime = 2000;

  useEffect(() => {
    let timeout;

    const currentWord = words[wordIndex];
    const nextWord = words[(wordIndex + 1) % words.length];

    if (!isDeleting && displayText !== currentWord) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayText(currentWord.slice(0, displayText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayText === currentWord) {
      // Pause after typing full word
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && displayText !== "") {
      // Deleting backward
      timeout = setTimeout(() => {
        setDisplayText(displayText.slice(0, -1));
      }, deletingSpeed);
    } else if (isDeleting && displayText === "") {
      // Move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  // Carousel auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchBlogs();
  }, []);

  useEffect(() => {
    const handleLastLoginEvent = (event) => {
      const data = event.detail;
      if (data) {
        setLastLoginNotification({
          email: data.email,
          lastLogin: data.lastLogin
        });
        setShowLastLoginToast(true);
        sessionStorage.removeItem('showLastLoginNotification');
      }
    };

    const notificationData = sessionStorage.getItem('showLastLoginNotification');
    if (notificationData) {
      try {
        const data = JSON.parse(notificationData);
        const timeSinceLogin = Date.now() - data.timestamp;
        if (timeSinceLogin < 30000) {
          setLastLoginNotification({
            email: data.email,
            lastLogin: data.lastLogin
          });
          setShowLastLoginToast(true);
        }
        sessionStorage.removeItem('showLastLoginNotification');
      } catch (e) {
        sessionStorage.removeItem('showLastLoginNotification');
      }
    }

    window.addEventListener('show-last-login-toast', handleLastLoginEvent);
    return () => {
      window.removeEventListener('show-last-login-toast', handleLastLoginEvent);
    };
  }, []);

  useEffect(() => {
    if (showLastLoginToast) {
      const timer = setTimeout(() => {
        setShowLastLoginToast(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showLastLoginToast]);

  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
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

  const fetchBlogs = async () => {
    try {
      const res = await contentService.listBlogPostsUser({ page: 1, limit: 4, sort: 'newest' });
      const items = res?.data || res?.posts || [];
      setBlogs(items.slice(0, 4));
    } catch (e) {
      console.error('Failed to fetch blogs', e);
      setBlogs([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      let minPrice, maxPrice;
      switch (filters.priceRange) {
        case '0-500': minPrice = 0; maxPrice = 500; break;
        case '500-1000': minPrice = 500; maxPrice = 1000; break;
        case '1000-2000': minPrice = 1000; maxPrice = 2000; break;
        case '2000+': minPrice = 2000; maxPrice = undefined; break;
        default: minPrice = undefined; maxPrice = undefined;
      }

      const params = {
        search: filters.search || '',
        category: filters.category || '',
        careLevel: filters.careLevel || '',
        minPrice,
        maxPrice,
        limit: 8,
        page: 1,
        sort: 'newest',
      };

      const response = await productService.getAllProducts(params);
      if (response.success && response.data) {
        const list = Array.isArray(response.data) ? response.data.slice(0, 8) : [];
        setProducts(list);
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

  const handleViewMore = () => {
    navigate('/products');
  };

  return (
    <div className="landing-page">
      <style>{`
        body {
  background-color: #FAFAE6;
}


        @keyframes blink {
          0%, 100% { border-color: #fff; }
          50% { border-color: transparent; }
        }

        .typing-text {
          display: inline-block;
          border-right: 3px solid #fff;
          padding-right: 8px;
          animation: blink 0.8s step-end infinite;
          min-width: 150px;
          text-align: left;
        }

       .hero-section {
 background: linear-gradient(
  to bottom,
  rgba(16, 91, 20, 0.75),
  rgba(68, 150, 91, 0.35),
  rgba(245, 245, 220, 0.9)
);
backdrop-filter: blur(5px);


  min-height: 10vh;
}




        .carousel-container {
          position: relative;
          height: 280px;
          overflow: hidden;
        }

        .carousel-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: opacity 1.5s ease-in-out;
        }

        .logo-round {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        @media (min-width: 992px) {
          .carousel-container { height: 320px; }
          .logo-round { width: 180px; height: 180px; }
        }

        @media (min-width: 1200px) {
          .carousel-container { height: 360px; }
          .logo-round { width: 200px; height: 200px; }
        }
      `}</style>

      {/* Hero Section with Animation */}
      <section className="hero-section py-4">
        <div className="container">
          <div className="row align-items-center" style={{ minHeight: '10vh' }}>
            <div className="col-lg-6 text-white">
              <h4 className="display-6 fw-20px mb-3">
                Nature knows the way
              </h4>
              <span className="display-6 fw-bold mb-3">
                - just <span className="display-6 fw-bold mb-3">{displayText}</span>
                <span className="cursor">|</span>
              </span><br /><br />
              <button className="btn btn-light btn-lg shadow" onClick={() => navigate('/products')}>
                <i className="bi bi-arrow-right-circle me-2"></i>
                Explore Plants
              </button>
            </div>
            <div className="col-lg-6 text-center mt-4 mt-lg-0">
              <img
                src={bleafLogo}
                alt="Bleaf Logo"
                className="logo-round"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-4 bg-#9ef8b4ff">
        <div className="container">
          <div className="position-relative carousel-container rounded-4 shadow-lg overflow-hidden mx-auto"
           style={{
                  width: "82%",
                  maxWidth: "1200px", 
                  height: "400px", // or "60vh" for relative to screen
                }}>
            {carouselImages.map((image, index) => (
              <div 
                key={index} 
                className="carousel-slide"
                style={{
                  opacity: index === currentCarouselIndex ? 1 : 0,
                  zIndex: index === currentCarouselIndex ? 1 : 0,
                  pointerEvents: index === currentCarouselIndex ? 'auto' : 'none'
                }}
              >
                <img 
                  src={image} 
                  className="w-100 h-100" 
                  alt={`Plant Collection ${index + 1}`}
                  style={{ objectFit: 'contain', backgroundColor: '#E6DCBE' }}
                  onError={(e) => {
                    console.log('Image failed to load:', image);
                    e.target.style.background = '#2d5f3f';
                    e.target.alt = 'Image not found';
                  }}
                />
               
              </div>
            ))}
            
            {/* Navigation Buttons */}
            <button 
              className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle ms-3" 
              style={{ width: '50px', height: '50px', zIndex: 10 }}
              onClick={() => setCurrentCarouselIndex((prev) => prev === 0 ? carouselImages.length - 1 : prev - 1)}
              aria-label="Previous"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button 
              className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle me-3" 
              style={{ width: '50px', height: '50px', zIndex: 10 }}
              onClick={() => setCurrentCarouselIndex((prev) => (prev + 1) % carouselImages.length)}
              aria-label="Next"
            >
              <i className="bi bi-chevron-right"></i>
            </button>

            {/* Indicators */}
            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2" style={{ zIndex: 10 }}>
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  className={`rounded-circle border-0 ${index === currentCarouselIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                  style={{ width: '12px', height: '12px', cursor: 'pointer' }}
                  onClick={() => setCurrentCarouselIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-md-3">
              <div className="p-4 rounded-3 shadow-sm bg-white h-100">
                <i className="bi bi-truck text-success display-4 mb-3"></i>
                <h5 className="fw-bold">Free Delivery</h5>
                <p className="text-muted small mb-0">On orders above ₹999</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4 rounded-3 shadow-sm bg-white h-100">
                <i className="bi bi-shield-check text-success display-4 mb-3"></i>
                <h5 className="fw-bold">Quality Guaranteed</h5>
                <p className="text-muted small mb-0">Healthy & fresh plants</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4 rounded-3 shadow-sm bg-white h-100">
                <i className="bi bi-headset text-success display-4 mb-3"></i>
                <h5 className="fw-bold">Expert Support</h5>
                <p className="text-muted small mb-0">Plant care assistance</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4 rounded-3 shadow-sm bg-white h-100">
                <i className="bi bi-arrow-repeat text-success display-4 mb-3"></i>
                <h5 className="fw-bold">Easy Returns</h5>
                <p className="text-muted small mb-0">7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-5 bg-#9ef8b4ff" >
        <div className="container" >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div >
              <h2 className="fw-bold mb-1">Our Plant Collection</h2>
              <p className="text-muted mb-0">Explore our wide variety of indoor and outdoor plants</p>
            </div>
            <button className="btn btn-success" onClick={handleViewMore}>
              View All <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>

          {/* Filter Section */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body bg-#E6DCBE">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-muted">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search plants..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                
                <div className="col-md-3">
                  <label className="form-label small fw-semibold text-muted">Category</label>
                  <select
                    className="form-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold text-muted">Price Range</label>
                  <select
                    className="form-select"
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  >
                    <option value="">All Prices</option>
                    <option value="0-500">Under ₹500</option>
                    <option value="500-1000">₹500 - ₹1000</option>
                    <option value="1000-2000">₹1000 - ₹2000</option>
                    <option value="2000+">Above ₹2000</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label small fw-semibold text-muted">Care Level</label>
                  <select
                    className="form-select"
                    value={filters.careLevel}
                    onChange={(e) => handleFilterChange('careLevel', e.target.value)}
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

          {error && (
            <div className="alert alert-danger shadow-sm" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <ProductGrid products={products} loading={loading} />
        </div>
      </section>

      {/* Blogs Section */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">From Our Blog</h2>
              <p className="text-muted mb-0">Latest tips and guides for plant care</p>
            </div>
            <a href="/blogs" className="btn btn-outline-success">
              View All Blogs <i className="bi bi-arrow-right ms-2"></i>
            </a>
          </div>

          {blogs.length === 0 ? (
            <p className="text-muted text-center py-5">No blog posts available yet.</p>
          ) : (
            <div className="row g-4">
              {blogs.map((post) => (
                <div key={post.id || post.slug} className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 overflow-hidden">
                    {post.cover_image && (
                      <img 
                        src={post.cover_image} 
                        alt={post.title} 
                        className="card-img-top" 
                        style={{ objectFit: 'cover', height: '200px' }}
                      />
                    )}
                    <div className="card-body">
                      <h6 className="card-title fw-bold mb-2">{post.title}</h6>
                      <p className="card-text text-muted small mb-3">
                        {post.excerpt || post.summary || ''}
                      </p>
                      <a href="/blogs" className="btn btn-sm btn-success">
                        Read More <i className="bi bi-arrow-right ms-1"></i>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Last Login Toast - Light Green Theme */}
      {showLastLoginToast && lastLoginNotification && (
        <div 
          className="position-fixed bottom-0 end-0 p-3" 
          style={{ zIndex: 9999, maxWidth: '420px' }}
        >
          <div 
            className="toast show shadow-lg border-0" 
            role="alert" 
            style={{ borderLeft: '4px solid #22c55e' }}
          >
            <div className="toast-header text-white" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
              <i className="bi bi-shield-check-fill me-2"></i>
              <strong className="me-auto">Security Alert</strong>
              <small>{new Date().toLocaleTimeString()}</small>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setShowLastLoginToast(false)}
              ></button>
            </div>
            <div className="toast-body bg-light">
              <div className="mb-2">
                <i className="bi bi-person-circle text-success me-2 fs-5"></i>
                <strong>Welcome back!</strong>
              </div>
              <div className="mb-2">
                <i className="bi bi-clock-history text-success me-2"></i>
                <small className="text-muted">Your last login was on:</small>
                <br />
                <strong className="text-success">{formatLastLogin(lastLoginNotification.lastLogin)}</strong>
              </div>
              <hr />
              <div className="alert alert-success border-success py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Wasn't you?</strong>
                <p className="mb-2 mt-1">
                  If this wasn't you, please secure your account immediately.
                </p>
                <button 
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    setShowLastLoginToast(false);
                    navigate('/profile');
                  }}
                >
                  <i className="bi bi-shield-lock me-1"></i>
                  Go to Profile & Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;