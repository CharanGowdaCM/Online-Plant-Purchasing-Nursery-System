/*
Review Controller - Reviews operations
 Author: Charan Gowda C M
 Features: Add review, Get reviews for a product, Get reviews by user
*/

const ReviewModel = require('../models/ReviewModel');
const OrderModel = require('../models/orderModel');
const { validateReview } = require('../utils/validators/reviewValidator');
const { recordActivity } = require('../utils/activityRecorder');

const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const validation = validateReview({ rating, title, comment });
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

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

    const alreadyReviewed = await ReviewModel.hasUserReviewed(userId, productId, eligibleOrder.id);
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    const review = await ReviewModel.addReview(
      userId,
      productId,
      eligibleOrder.id,
      rating,
      title,
      comment
    );

    recordActivity(req, 'CREATE', 'Review', review.id, {
      product_id: productId,
      order_id: eligibleOrder.id,
      rating: rating,
      title: title
    });

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
    console.log('Reviews fetched for product', productId, reviews);


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
