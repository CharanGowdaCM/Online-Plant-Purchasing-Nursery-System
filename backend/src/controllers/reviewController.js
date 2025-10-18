// controllers/reviewController.js
const ReviewModel = require('../models/ReviewModel');
const OrderModel = require('../models/orderModel');
const { validateReview } = require('../utils/validators/reviewValidator');

const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    const validation = validateReview({ rating, title, comment });
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    // Fetch user's delivered orders
    const deliveredOrders = await OrderModel.getOrdersByUserId(userId);
    const eligibleOrder = deliveredOrders.find(order =>
      order.status === 'delivered' &&
      order.order_items.some(item => item.product_id === productId)
    );

    if (!eligibleOrder) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you purchased and received'
      });
    }

    // Check if already reviewed
    const alreadyReviewed = await ReviewModel.hasUserReviewed(userId, productId, eligibleOrder.id);
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    // Add review
    const review = await ReviewModel.addReview(
      userId,
      productId,
      eligibleOrder.id,
      rating,
      title,
      comment
    );

    res.json({
      success: true,
      message: 'Review submitted successfully.',
      review
    });
  } catch (err) {
    console.error('Error in addReview:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await ReviewModel.getReviewsByProduct(productId);

    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Error in getProductReviews:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id; 
    const reviews = await ReviewModel.getReviewsByUser(userId);

    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Error in getUserReviews:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  addReview,
  getProductReviews,
    getUserReviews
};
