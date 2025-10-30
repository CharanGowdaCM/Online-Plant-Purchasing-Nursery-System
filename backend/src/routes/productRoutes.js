const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { validateProductFilters } = require('../utils/validators/productValidator');

router.get('/', validateProductFilters, ProductController.listProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:slug', ProductController.getProductDetails);

module.exports = router;