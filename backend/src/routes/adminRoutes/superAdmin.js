const express = require('express');
const router = express.Router();
const SuperAdminController = require('../../controllers/admin/superAdminController');
const { verifyToken, superAdminOnly } = require('../../middleware/auth');

// All routes require super admin privileges
router.use(verifyToken, superAdminOnly);

// Analytics & Statistics
router.get('/analytics/users', SuperAdminController.getUserAnalytics);
router.get('/analytics/sales', SuperAdminController.getSalesAnalytics);
router.get('/platform/stats', SuperAdminController.getPlatformStats);
router.get('/orders', SuperAdminController.getAllOrders); 
router.get('/orders/:orderId', SuperAdminController.getOrderDetails); 

// Admin Management
router.post('/admins/manage', SuperAdminController.manageAdminRoles);

// Audit Logs
router.get('/activity-logs', SuperAdminController.getActivityLogs);

module.exports = router;