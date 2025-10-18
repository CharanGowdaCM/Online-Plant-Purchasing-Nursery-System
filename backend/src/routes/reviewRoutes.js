// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { addReview, getProductReviews } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/products/:productId/reviews', verifyToken, addReview);
router.get('/products/:productId/reviews', getProductReviews);
router.get('/my-reviews', verifyToken, reviewController.getUserReviews);


module.exports = router;
