const jwt = require("jsonwebtoken");

const activeSessions = new Map();

const ADMIN_ROLES = ['inventory_admin', 'order_admin', 'support_admin', 'content_admin', 'super_admin'];

// Verify JWT token and check active session
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }

  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check if user session is active
    if (!activeSessions.has(decoded.id)) {
      return res.status(401).json({ success: false, message: "Session expired. Please login again." });
    }

    // Update last activity
    activeSessions.set(decoded.id, Date.now());
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Insufficient permissions." 
      });
    }

    next();
  };
};

// Role-specific middleware
const superAdminOnly = authorize('super_admin');
const inventoryAdmin = authorize('inventory_admin', 'super_admin');
const orderAdmin = authorize('order_admin', 'super_admin');
const supportAdmin = authorize('support_admin', 'super_admin');
const contentAdmin = authorize('content_admin', 'super_admin');
const anyAdmin = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }
  next();
};

// Session cleanup - removes inactive sessions
const cleanupInactiveSessions = (timeout) => {
  const now = Date.now();
  for (const [userId, lastActivity] of activeSessions.entries()) {
    if (now - lastActivity > timeout) {
      activeSessions.delete(userId);
      console.log(`Session expired for user: ${userId}`);
    }
  }
};

module.exports = {
  verifyToken,
  authorize,
  superAdminOnly,
  inventoryAdmin,
  orderAdmin,
  supportAdmin,
  contentAdmin,
  anyAdmin,
  activeSessions,
  cleanupInactiveSessions
};
