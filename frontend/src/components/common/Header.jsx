import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';
import LoginModal from '../auth/LoginModal';

const Header = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const userRole = getUserRole();

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
      <nav className="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow">
        <div className="container-fluid">
          <button
            className="btn btn-outline-light me-3"
            onClick={onToggleSidebar}
            type="button"
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          <a className="navbar-brand fw-bold" href="/">
            <i className="bi bi-flower1 me-2"></i>
            {APP_NAME}
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/">Home</a>
              </li>
              {isAuthenticated && userRole === 'customer' && (
                <li className="nav-item">
                  <a className="nav-link" href="/dashboard">Dashboard</a>
                </li>
              )}
              {userRole !== 'customer' && userRole !== 'guest' && (
                <li className="nav-item dropdown">
                  <a 
                    className="nav-link dropdown-toggle" 
                    href="#" 
                    id="adminDropdown" 
                    role="button" 
                    data-bs-toggle="dropdown"
                  >
                    Admin Panel
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <a className="dropdown-item" href="/admin">
                        Dashboard
                      </a>
                    </li>
                    {(userRole === 'inventory_admin' || userRole === 'super_admin') && (
                      <li>
                        <a className="dropdown-item" href="/admin/inventory">
                          Inventory Management
                        </a>
                      </li>
                    )}
                    {(userRole === 'order_admin' || userRole === 'super_admin') && (
                      <li>
                        <a className="dropdown-item" href="/admin/orders">
                          Order Management
                        </a>
                      </li>
                    )}
                    {(userRole === 'support_admin' || userRole === 'super_admin') && (
                      <li>
                        <a className="dropdown-item" href="/admin/support">
                          Support Management
                        </a>
                      </li>
                    )}
                    {(userRole === 'content_admin' || userRole === 'super_admin') && (
                      <li>
                        <a className="dropdown-item" href="/admin/content">
                          Content Management
                        </a>
                      </li>
                    )}
                    {userRole === 'super_admin' && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <a className="dropdown-item" href="/admin/system">
                            System Administration
                          </a>
                        </li>
                      </>
                    )}
                  </ul>
                </li>
              )}
            </ul>

            <form className="d-flex mx-auto my-2 my-lg-0" style={{ width: '40%' }}>
              <div className="input-group">
                <input
                  className="form-control"
                  type="search"
                  placeholder="Search plants..."
                  aria-label="Search"
                />
                <button className="btn btn-light" type="submit">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>

            <ul className="navbar-nav ms-auto align-items-center">
              {isAuthenticated ? (
                <>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle d-flex align-items-center"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-person-circle fs-4 me-2"></i>
                      <span>{user?.first_name || 'User'}</span>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      {userRole === 'customer' && (
                        <>
                          <li>
                            <a className="dropdown-item" href="/dashboard">
                              <i className="bi bi-speedometer2 me-2"></i>Dashboard
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="/profile">
                              <i className="bi bi-person me-2"></i>My Profile
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="/orders">
                              <i className="bi bi-box-seam me-2"></i>My Orders
                            </a>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                        </>
                      )}
                      {userRole !== 'customer' && userRole !== 'guest' && (
                        <>
                          <li>
                            <a className="dropdown-item" href="/admin">
                              <i className="bi bi-gear me-2"></i>Admin Panel
                            </a>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                        </>
                      )}
                      <li>
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                  
                  {userRole === 'customer' && (
                    <li className="nav-item ms-3">
                      <a className="nav-link position-relative" href="/cart">
                        <i className="bi bi-cart3 fs-4"></i>
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          0
                        </span>
                      </a>
                    </li>
                  )}
                </>
              ) : (
                <li className="nav-item">
                  <button
                    className="btn btn-light"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </button>
                </li>
              )}
            </ul>
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