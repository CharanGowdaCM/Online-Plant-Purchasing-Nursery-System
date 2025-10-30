const validateCategoryPayload = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Category name is required.');
  }

  if (!data.slug || data.slug.trim().length === 0) {
    errors.push('Slug is required.');
  }

  if (data.display_order && isNaN(data.display_order)) {
    errors.push('Display order must be a number.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = { validateCategoryPayload };
