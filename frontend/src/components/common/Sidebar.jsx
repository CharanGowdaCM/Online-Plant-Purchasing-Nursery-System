import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, getUserRole } = useAuth();
  const userRole = getUserRole();

  const customerMenuItems = [
    { icon: 'house-door', label: 'Home', path: '/', color: '#2d5f3f' },
    { icon: 'info-circle', label: 'About Us', path: '/about', color: '#15803d' },
    { icon: 'grid-3x3-gap', label: 'All Plants', path: '/products', color: '#3a7d52' },
    { icon: 'leaf', label: 'Plant Care Dashboard', path: '/plant-care', color: '#0f766e' },
    { icon: 'journal-text', label: 'Blogs', path: '/blogs', color: '#16a34a' },
    { icon: 'patch-question', label: 'FAQs', path: '/faqs', color: '#166534' },
  ];

  const adminMenuItems = {
    super_admin: [
      { icon: 'speedometer2', label: 'System Dashboard', path: '/admin/system', color: '#2d5f3f' },
      { icon: 'box-seam', label: 'Inventory', path: '/admin/inventory', color: '#3a7d52' },
      { icon: 'cart-check', label: 'Orders', path: '/admin/orders', color: '#4ade80' },
      { icon: 'headset', label: 'Support', path: '/admin/support', color: '#22c55e' },
      { icon: 'file-text', label: 'Content', path: '/admin/content', color: '#16a34a' },
    ],
    inventory_admin: [
      { icon: 'speedometer2', label: 'Dashboard', path: '/admin', color: '#2d5f3f' },
      { icon: 'box-seam', label: 'Inventory', path: '/admin/inventory', color: '#3a7d52' },
      { icon: 'plus-circle', label: 'Add Product', path: '/admin/inventory/products', color: '#4ade80' },
    ],
    order_admin: [
      { icon: 'speedometer2', label: 'Dashboard', path: '/admin', color: '#2d5f3f' },
      { icon: 'cart-check', label: 'Orders', path: '/admin/orders', color: '#3a7d52' },
    ],
    support_admin: [
      { icon: 'speedometer2', label: 'Dashboard', path: '/admin', color: '#2d5f3f' },
      { icon: 'headset', label: 'Support Tickets', path: '/admin/support', color: '#3a7d52' },
    ],
    content_admin: [
      { icon: 'speedometer2', label: 'Dashboard', path: '/admin', color: '#2d5f3f' },
      { icon: 'file-text', label: 'Content', path: '/admin/content', color: '#3a7d52' },
    ],
  };

  const menuItems = userRole !== 'customer' && userRole !== 'guest'
    ? adminMenuItems[userRole] || []
    : customerMenuItems;

  const isAdmin = userRole !== 'customer' && userRole !== 'guest';

  return (
    <>
      <style>{`
        .bleaf-sidebar-backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          transition: opacity 0.3s ease;
        }

        .bleaf-sidebar {
          background: #FAFAE6;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
          transition: transform 0.3s ease, visibility 0.3s ease;
          width: 300px;
        }

        .sidebar-header {
          background: linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%);
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .sidebar-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }

        .sidebar-title {
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .sidebar-title-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .sidebar-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .sidebar-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .user-profile-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 20px;
          margin: 16px;
          border-radius: 16px;
          border: 1px solid #bbf7d0;
          box-shadow: 0 2px 8px rgba(45, 95, 63, 0.08);
        }

        .user-avatar-large {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 4px 12px rgba(45, 95, 63, 0.2);
        }

        .user-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .user-email {
          font-size: 13px;
          color: #6b7280;
          margin: 2px 0 0 0;
        }

        .user-role-badge {
          display: inline-block;
          background: linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%);
          color: #fff;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 8px;
        }

        .sidebar-nav {
          padding: 8px 0;
        }

        .sidebar-section-title {
          padding: 16px 20px 8px;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          margin: 4px 12px;
          color: #374151;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .sidebar-nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: currentColor;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar-nav-item:hover {
          background: #f9fafb;
          color: #2d5f3f;
          padding-left: 24px;
          transform: translateX(4px);
        }

        .sidebar-nav-item:hover::before {
          transform: translateX(0);
        }

        .sidebar-nav-item:active {
          transform: translateX(4px) scale(0.98);
        }

        .sidebar-nav-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 10px;
          font-size: 18px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .sidebar-nav-item:hover .sidebar-nav-icon {
          background: #e5e7eb;
          transform: scale(1.1) rotate(-5deg);
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .sidebar-settings-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #6b7280;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .sidebar-settings-link:hover {
          background: #f9fafb;
          color: #2d5f3f;
        }

        .sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 16px 0;
        }

        @media (max-width: 576px) {
          .bleaf-sidebar {
            width: 280px;
          }

          .user-profile-card {
            margin: 12px;
            padding: 16px;
          }

          .sidebar-nav-item {
            padding: 12px 16px;
            margin: 2px 8px;
          }
        }
      `}</style>

      <div
        className={`bleaf-sidebar-backdrop offcanvas-backdrop fade ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        style={{ display: isOpen ? 'block' : 'none' }}
      />

      <div
        className={`bleaf-sidebar offcanvas offcanvas-start ${isOpen ? 'show' : ''}`}
        tabIndex="-1"
        style={{
          visibility: isOpen ? 'visible' : 'hidden',
        }}
      >
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <h5 className="sidebar-title">
            <div className="sidebar-title-icon">
              {isAdmin ? <i className="bi bi-gear-fill"></i> : <i className="bi bi-list-ul"></i>}
            </div>
            <span>{isAdmin ? 'Admin Panel' : 'Navigation'}</span>
          </h5>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="offcanvas-body p-0 d-flex flex-column">
          {isAuthenticated && (
            <div className="user-profile-card">
              <div className="d-flex align-items-center gap-3">
                <div className="user-avatar-large">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-grow-1">
                  <p className="user-name">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="user-email">{user?.email}</p>
                  {isAdmin && (
                    <span className="user-role-badge">
                      {userRole.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <nav className="sidebar-nav flex-grow-1">
            {!isAuthenticated && (
              <div className="sidebar-section-title">
                Browse
              </div>
            )}
            
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.path}
                className="sidebar-nav-item"
                onClick={onClose}
                style={{ '--item-color': item.color }}
              >
                <div 
                  className="sidebar-nav-icon"
                  style={{ color: item.color }}
                >
                  <i className={`bi bi-${item.icon}`}></i>
                </div>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {isAuthenticated && (
            <div className="sidebar-footer" >
              <div className="sidebar-divider"></div>
              <a 
                href="/profile" 
                className="sidebar-settings-link" 
                onClick={onClose}
              >
                <i className="bi bi-gear fs-5"></i>
                <span>Settings</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;