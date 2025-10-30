// utils/validators/reviewValidator.js

const validateReview = (data) => {
  const errors = {};

  if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be a number between 1 and 5';
  }

  if (data.title && data.title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }

  if (data.comment && data.comment.length > 1000) {
    errors.comment = 'Comment cannot exceed 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = { validateReview };
