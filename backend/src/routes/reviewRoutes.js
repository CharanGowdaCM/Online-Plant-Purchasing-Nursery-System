
const express = require('express');
const router = express.Router();
const { addReview, getProductReviews, getUserReviews } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

router.post('/products/:productId/reviews', verifyToken, addReview);
router.get('/products/:productId/reviews', getProductReviews);
router.get('/my-reviews', verifyToken, getUserReviews);


module.exports = router;
