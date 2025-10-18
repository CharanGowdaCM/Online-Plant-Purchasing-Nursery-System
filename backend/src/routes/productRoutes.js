const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');
const { validateProductFilters } = require('../utils/validators/productValidator');

// Public routes
router.get('/', validateProductFilters, ProductController.listProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:slug', ProductController.getProductDetails);

module.exports = router;