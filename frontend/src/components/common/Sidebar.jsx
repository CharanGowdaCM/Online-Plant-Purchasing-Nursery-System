import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const customerMenuItems = [
    { icon: 'house', label: 'Home', path: '/' },
    { icon: 'grid', label: 'All Plants', path: '/plants' },
    { icon: 'tags', label: 'Categories', path: '/categories' },
    { icon: 'percent', label: 'Offers', path: '/offers' },
    { icon: 'book', label: 'Plant Care', path: '/care-guides' },
    { icon: 'question-circle', label: 'FAQ', path: '/faq' },
    { icon: 'telephone', label: 'Contact Us', path: '/contact' },
  ];

  const adminMenuItems = [
    { icon: 'speedometer2', label: 'Dashboard', path: '/admin' },
    { icon: 'box-seam', label: 'Inventory', path: '/admin/inventory' },
    { icon: 'cart-check', label: 'Orders', path: '/admin/orders' },
    { icon: 'people', label: 'Customers', path: '/admin/customers' },
    { icon: 'life-preserver', label: 'Support Tickets', path: '/admin/support' },
    { icon: 'file-text', label: 'Content', path: '/admin/content' },
  ];

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  return (
    <>
      {/* Overlay */}
      <div
        className={`offcanvas-backdrop fade ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        style={{ display: isOpen ? 'block' : 'none' }}
      ></div>

      {/* Sidebar */}
      <div
        className={`offcanvas offcanvas-start ${isOpen ? 'show' : ''}`}
        tabIndex="-1"
        style={{
          visibility: isOpen ? 'visible' : 'hidden',
          width: '280px',
        }}
      >
        <div className="offcanvas-header bg-success text-white">
          <h5 className="offcanvas-title">
            <i className="bi bi-list-ul me-2"></i>
            {isAdmin ? 'Admin Menu' : 'Menu'}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
          ></button>
        </div>

        <div className="offcanvas-body p-0">
          {isAuthenticated && (
            <div className="p-3 bg-light border-bottom">
              <div className="d-flex align-items-center">
                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                     style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                  {user?.first_name?.[0] || 'U'}
                </div>
                <div>
                  <div className="fw-bold">{user?.first_name} {user?.last_name}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
              </div>
            </div>
          )}

          <nav className="nav flex-column">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.path}
                className="nav-link text-dark py-3 px-4 border-bottom"
                onClick={onClose}
              >
                <i className={`bi bi-${item.icon} me-3`}></i>
                {item.label}
              </a>
            ))}
          </nav>

          {isAuthenticated && (
            <div className="p-3 border-top mt-auto">
              <a href="/settings" className="nav-link text-dark" onClick={onClose}>
                <i className="bi bi-gear me-3"></i>
                Settings
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;