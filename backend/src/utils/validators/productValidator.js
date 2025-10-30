const validateProductFilters = (req, res, next) => {
  const { page, limit, minPrice, maxPrice } = req.query;

  // Validate pagination
  if (page && (!Number.isInteger(+page) || +page < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid page number'
    });
  }

  if (limit && (!Number.isInteger(+limit) || +limit < 1 || +limit > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid limit value'
    });
  }

  // Validate price range
  if (minPrice && isNaN(minPrice)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid minimum price'
    });
  }

  if (maxPrice && isNaN(maxPrice)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid maximum price'
    });
  }

  next();
};

module.exports = {
  validateProductFilters
};