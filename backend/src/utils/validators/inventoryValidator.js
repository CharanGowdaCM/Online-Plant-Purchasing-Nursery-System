const validateInventoryData = (mode) => (req, res, next) => {
  const errors = {};
  const data = req.body;

  if (mode === 'update') {
    const { quantity, operation } = data;

    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = 'Quantity must be a positive integer';
    }

    if (!operation || !['increase', 'decrease'].includes(operation)) {
      errors.operation = 'Operation must be either increase or decrease';
    }
  } else if (mode === 'add') {
    const requiredFields = ['sku', 'name', 'category_id', 'price'];

    requiredFields.forEach((field) => {
      if (!data[field]) {
        errors[field] = `${field} is required`;
      }
    });

    if (data.price !== undefined && (typeof data.price !== 'number' || data.price <= 0)) {
      errors.price = 'Price must be a positive number';
    }

    if (data.stock_quantity !== undefined && (!Number.isInteger(data.stock_quantity) || data.stock_quantity < 0)) {
      errors.stock_quantity = 'Stock quantity must be a non-negative integer';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = {
  validateInventoryData,
};
