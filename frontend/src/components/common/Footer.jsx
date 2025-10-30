import { APP_NAME } from '../../utils/constants';
import bleafLogo from '../../assets/bleaf_logo-2.png';

const Footer = () => {
  return (
    <footer style={{ 
      backgroundColor: '#2C5F2D', 
      color: '#FFFFFF',
    }}>
      <div className="container py-5">
        <div className="row g-4">
          {/* Brand Section */}
          <div className="col-md-4 mb-4">
            <div className="d-flex align-items-center mb-3">
              <img 
                src={bleafLogo} 
                alt="Bleaf Logo" 
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: '12px',
                  border: '2px solid #97C97D',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              />
              <h5 className="mb-0" style={{ 
                fontWeight: '700',
                fontSize: '1.5rem',
                color: '#FFFFFF'
              }}>
                {APP_NAME}
              </h5>
            </div>
             <p style={{ 
              color: '#E5E7EB',
              fontSize: '1.5rem',
              lineHeight: '1.6'
            }}>
              Nature knows its way <br></br>- just Bleaf, just Believe
            </p>
            <p style={{ 
              color: '#E5E7EB',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Kaadu Belesi, Naadu Ulisi
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-4">
            <h6 className="mb-3" style={{ 
              fontWeight: '600',
              fontSize: '1.1rem',
              color: '#FFFFFF'
            }}>
              Quick Links
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a 
                  href="/about" 
                  style={{ 
                    color: '#E5E7EB',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#97C97D'}
                  onMouseLeave={(e) => e.target.style.color = '#E5E7EB'}
                >
                  About Us
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/products" 
                  style={{ 
                    color: '#E5E7EB',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#97C97D'}
                  onMouseLeave={(e) => e.target.style.color = '#E5E7EB'}
                >
                  Shop Plants
                </a>
              </li>
              
              <li className="mb-2">
                <a 
                  href="/blogs" 
                  style={{ 
                    color: '#E5E7EB',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#97C97D'}
                  onMouseLeave={(e) => e.target.style.color = '#E5E7EB'}
                >
                  Blogs
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/faqs" 
                  style={{ 
                    color: '#E5E7EB',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#97C97D'}
                  onMouseLeave={(e) => e.target.style.color = '#E5E7EB'}
                >
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-4 mb-4">
            <h6 className="mb-3" style={{ 
              fontWeight: '600',
              fontSize: '1.1rem',
              color: '#FFFFFF'
            }}>
              Contact Info
            </h6>
            <ul className="list-unstyled" style={{ color: '#E5E7EB' }}>
              <li className="mb-2" style={{ lineHeight: '1.6' }}>
                <i className="bi bi-geo-alt me-2" style={{ color: '#97C97D' }}></i>
                #A116, MT-1, NITK Surathkal, Mangaluru
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2" style={{ color: '#97C97D' }}></i>
                +91 9876543210
              </li>
              <li className="mb-2">
                <i className="bi bi-envelope me-2" style={{ color: '#97C97D' }}></i>
               bleaf.plantsorg@gmail.com
              </li>
              <li className="mb-2">
                <i className="bi bi-clock me-2" style={{ color: '#97C97D' }}></i>
                24 X 7 Support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;