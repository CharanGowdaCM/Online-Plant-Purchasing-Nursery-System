const validateProfile = (data) => {
  const errors = {};

  if (!data.first_name?.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!data.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (!data.permanent_address?.trim()) {
    errors.permanent_address = 'Permanent address is required';
  }

  if (!data.mobile_number) {
    errors.mobile_number = 'Mobile number is required';
  } else if (!/^\+?[1-9]\d{9,14}$/.test(data.mobile_number)) {
    errors.mobile_number = 'Invalid mobile number format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateUserStatusUpdate = (data) => {
  if (data.is_active === undefined) {
    return {
      isValid: false,
      errors: { is_active: 'is_active field is required' }
    };
  }
  return { isValid: true };
};

const validateUserRoleUpdate = (data, allowedRoles) => {
  if (!data.role || !allowedRoles.includes(data.role)) {
    return {
      isValid: false,
      errors: { role: `Role must be one of: ${allowedRoles.join(', ')}` }
    };
  }
  return { isValid: true };
};

module.exports = {
  validateProfile,
  validateUserStatusUpdate,
  validateUserRoleUpdate
};