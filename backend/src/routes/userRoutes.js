const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, superAdminOnly } = require('../middleware/auth');

// Public routes - none

// Protected routes
router.get('/profile', verifyToken, userController.getProfile);
router.post('/profile', verifyToken, userController.saveProfile);

// Super admin only routes
router.get('/admin/users', verifyToken, superAdminOnly, userController.listUsers);
router.get('/admin/users/:userId', verifyToken, superAdminOnly, userController.getUserDetails);
router.patch('/admin/users/:userId/status', verifyToken, superAdminOnly, userController.updateUserStatus);
router.patch('/admin/users/:userId/role', verifyToken, superAdminOnly, userController.updateUserRole);

module.exports = router;