const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {
  createTicket,
  getUserTickets,
  getTicketDetails,
} = require('../controllers/admin/supportTicketController.js');
const ContentController = require('../controllers/admin/contentController.js');

const { verifyToken, superAdminOnly } = require('../middleware/auth');

router.post('/profile/create', userController.saveProfile); 

router.get('/profile', verifyToken, userController.getProfile);
router.post('/profile', verifyToken, userController.saveProfile); 
router.post('/request-email-change', verifyToken, userController.requestEmailChange);
router.post('/verify-email-otp', verifyToken, userController.verifyEmailOTP);
router.post('/support', verifyToken, createTicket);
router.get('/support/my-tickets', verifyToken, getUserTickets);
router.get('/support/:ticketId', verifyToken, getTicketDetails);
router.get('/blog', ContentController.listBlogPosts);
router.get('/plant-guides', ContentController.listPlantGuides);

// Super admin only routes
router.get('/admin/users', verifyToken, superAdminOnly, userController.listUsers);
router.get('/admin/users/:userId', verifyToken, superAdminOnly, userController.getUserDetails);
router.patch('/admin/users/:userId/status', verifyToken, superAdminOnly, userController.updateUserStatus);
router.patch('/admin/users/:userId/role', verifyToken, superAdminOnly, userController.updateUserRole);

module.exports = router;