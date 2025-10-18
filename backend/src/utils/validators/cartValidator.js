const validateCartItem = (data) => {
  const errors = {};

  if (!data.productId) {
    errors.productId = 'Product ID is required';
  }

  if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    errors.quantity = 'Quantity must be a positive integer';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateCartItem
};