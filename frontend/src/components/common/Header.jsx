import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';
import LoginModal from '../auth/LoginModal';
import bleafLogo from '../../assets/bleaf_logo-2.png';
import { LanguageSwitcher } from './LanguageSwitcher';
import CartService from '../../services/cartService';

const Header = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
 
  const userRole = getUserRole();

  // Fetch cart items count when user is authenticated
  useEffect(() => {
    const fetchCartCount = async () => {
      if (isAuthenticated && userRole === 'customer') {
        try {
          const response = await CartService.getCart();
          console.log('Cart response:', response);
          if (response.success && response.data) {
            const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
            setCartItemsCount(count);
          }
        } catch (error) {
          console.error('Failed to fetch cart count:', error);
          setCartItemsCount(0);
        }
      } else {
        setCartItemsCount(0);
      }
    };

    fetchCartCount();

    // Listen for custom cart update events
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Set up an interval to refresh cart count periodically (optional)
    const interval = setInterval(fetchCartCount, 30000); // Refresh every 30 seconds

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, [isAuthenticated, userRole]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <style>{`
        .bleaf-header {
          background: linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .bleaf-header.scrolled {
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);
        }

        .menu-toggle-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 12px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .menu-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .bleaf-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
          transition: all 0.3s ease;
          padding: 8px 16px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .bleaf-logo:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          color: #fff;
        }

        .bleaf-logo-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          display: block;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
        }

        .bleaf-logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .bleaf-logo:hover .bleaf-logo-icon {
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(10deg);
        }

        .bleaf-logo-text {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-link-clean {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .nav-link-clean::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #fff;
          transition: width 0.3s ease;
        }

        .nav-link-clean:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-link-clean:hover::before {
          width: 60%;
        }

        .header-action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .user-menu-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 8px 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          position: relative;
        }

        .user-menu-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          min-width: 240px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1000;
          overflow: hidden;
        }

        .user-menu-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-menu-dropdown::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 20px;
          width: 12px;
          height: 12px;
          background: #fff;
          transform: rotate(45deg);
        }

        .dropdown-item-clean {
          padding: 12px 20px;
          color: #1f2937;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .dropdown-item-clean:last-child {
          border-bottom: none;
        }

        .dropdown-item-clean:hover {
          background: #f9fafb;
          color: #2d5f3f;
          padding-left: 24px;
        }

        .dropdown-item-clean.danger:hover {
          background: #fee;
          color: #dc2626;
        }

        .cart-icon-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .cart-icon-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
          transform: scale(1.05);
        }

        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        .language-switcher-wrapper {
          display: flex;
          align-items: center;
        }

        @media (max-width: 991px) {
          .bleaf-logo-text {
            font-size: 24px;
          }

          .bleaf-logo-icon {
            width: 36px;
            height: 36px;
            font-size: 20px;
          }

          .nav-link-clean {
            padding: 12px 16px;
            margin: 4px 0;
          }

          .header-actions {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
        }

        @media (max-width: 576px) {
          .bleaf-logo-text {
            font-size: 20px;
          }

          .menu-toggle-btn {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <nav className="bleaf-header navbar navbar-expand-lg navbar-dark sticky-top">
        <div className="container-fluid px-3 px-lg-4">
          <div className="d-flex align-items-center gap-3">
            <button
              className="menu-toggle-btn btn d-lg-block"
              onClick={onToggleSidebar}
              type="button"
              aria-label="Toggle menu"
            >
              <i className="bi bi-list fs-4"></i>
            </button>

           <a className="bleaf-logo" href="/">
            <div className="bleaf-logo-icon">
              <img src={bleafLogo} alt="Bleaf Logo" />
            </div>
            <span className="bleaf-logo-text">{APP_NAME}</span>
          </a>

          </div>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px 12px'
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            

            <div className="d-flex align-items-center gap-2 gap-lg-3 header-actions ms-auto">
              <div className="language-switcher-wrapper">
                <LanguageSwitcher />
              </div>

              {isAuthenticated ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="user-menu-btn"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                      type="button"
                    >
                      <div className="user-avatar">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="d-none d-md-inline fw-500">
                        {user?.first_name || 'User'}
                      </span>
                      <i className={`bi bi-chevron-down small transition ${showUserMenu ? 'rotate-180' : ''}`}></i>
                    </button>

                    <div className={`user-menu-dropdown ${showUserMenu ? 'show' : ''}`}>
                      {userRole === 'customer' && (
                        <>
                          <a className="dropdown-item-clean" href="/profile">
                            <i className="bi bi-person"></i>
                            <span>My Profile</span>
                          </a>
                        </>
                      )}
                      {userRole !== 'customer' && userRole !== 'guest' && (
                        <a className="dropdown-item-clean" href="/admin">
                          <i className="bi bi-gear"></i>
                          <span>Admin Panel</span>
                        </a>
                      )}
                      <button
                        className="dropdown-item-clean danger w-100 border-0 bg-transparent text-start"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>

                  {userRole === 'customer' && (
                    <a className="cart-icon-btn" href="/cart" aria-label="Shopping cart">
                      <i className="bi bi-bag fs-5"></i>
                      {cartItemsCount > 0 && (
                        <span className="cart-badge">{cartItemsCount}</span>
                      )}
                    </a>
                  )}
                </>
              ) : (
                <button
                  className="header-action-btn btn"
                  onClick={() => setShowLoginModal(true)}
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default Header;