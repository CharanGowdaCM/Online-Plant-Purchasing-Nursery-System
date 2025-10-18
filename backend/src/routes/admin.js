const express = require('express');
const router = express.Router();

const { 
  verifyToken, 
  superAdminOnly, 
  inventoryAdmin, 
  orderAdmin, 
  supportAdmin, 
  contentAdmin, 
  anyAdmin 
} = require('../middleware/auth');

const authController = require('../controllers/authController');

router.post('/create-admin', verifyToken, superAdminOnly, authController.createAdmin);
router.use('/superadmin', verifyToken, superAdminOnly, require('./adminRoutes/superAdmin'));

// router.get('/dashboard', verifyToken, anyAdmin, dashboardController.getDashboardStats);


router.use('/inventory', verifyToken, inventoryAdmin, require('./adminRoutes/inventory'));
router.use('/orders', verifyToken, orderAdmin, require('./adminRoutes/orderProcessing'));
// router.use('/support', verifyToken, supportAdmin, require('./adminRoutes/support'));
// router.use('/content', verifyToken, contentAdmin, require('./adminRoutes/content'));

module.exports = router;
