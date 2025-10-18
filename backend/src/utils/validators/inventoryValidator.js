const validateInventoryUpdate = (req, res, next) => {
  const { quantity, operation } = req.body;
  const errors = {};

  if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = 'Quantity must be a positive integer';
  }

  if (!operation || !['increase', 'decrease'].includes(operation)) {
    errors.operation = 'Operation must be either increase or decrease';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

module.exports = {
  validateInventoryUpdate
};