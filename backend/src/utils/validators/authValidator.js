// utils/validators/authValidator.js

/**
 * Auth Validators - Input validation utilities for authentication
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

const VALID_ROLES = [
  'customer',
  'inventory_admin',
  'order_admin',
  'support_admin',
  'content_admin',
  'super_admin'
];

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  if (typeof email !== 'string') {
    return { isValid: false, message: "Email must be a string" };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  if (email.length > 254) {
    return { isValid: false, message: "Email is too long" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (typeof password !== 'string') {
    return { isValid: false, message: "Password must be a string" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { 
      isValid: false, 
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` 
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { 
      isValid: false, 
      message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters` 
    };
  }

  // Check for at least one uppercase, one lowercase, one number, and one special character
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validateOTP = (otp) => {
  if (!otp) {
    return { isValid: false, message: "OTP is required" };
  }

  if (typeof otp !== 'string') {
    return { isValid: false, message: "OTP must be a string" };
  }

  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, message: "OTP must be a 6-digit number" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { isValid: boolean, message: string }
 */
const validateName = (name, fieldName = "Name") => {
  if (!name) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (typeof name !== 'string') {
    return { isValid: false, message: `${fieldName} must be a string` };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_NAME_LENGTH) {
    return { 
      isValid: false, 
      message: `${fieldName} must be at least ${MIN_NAME_LENGTH} characters long` 
    };
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { 
      isValid: false, 
      message: `${fieldName} must not exceed ${MAX_NAME_LENGTH} characters` 
    };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { 
      isValid: false, 
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` 
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validatePhoneNumber = (phone) => {
  if (!phone) {
    return { isValid: false, message: "Phone number is required" };
  }

  if (typeof phone !== 'string') {
    return { isValid: false, message: "Phone number must be a string" };
  }

  // International phone format: +[country code][number] (10-15 digits)
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;

  if (!phoneRegex.test(phone)) {
    return { 
      isValid: false, 
      message: "Invalid phone number format. Use international format (e.g., +1234567890)" 
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate token format
 * @param {string} token - Token to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validateToken = (token) => {
  if (!token) {
    return { isValid: false, message: "Token is required" };
  }

  if (typeof token !== 'string') {
    return { isValid: false, message: "Token must be a string" };
  }

  // Tokens should be hex strings of reasonable length
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return { isValid: false, message: "Invalid token format" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate signup request
 * @param {Object} data - Signup data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
const validateSignupRequest = (data) => {
  const errors = {};

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  if (data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate login request
 * @param {Object} data - Login data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
const validateLoginRequest = (data) => {
  const errors = {};

  if (!data.email) {
    errors.email = "Email is required";
  }

  if (!data.password) {
    errors.password = "Password is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate password reset request
 * @param {Object} data - Reset request data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
const validateResetRequest = (data) => {
  const errors = {};

  const tokenValidation = validateToken(data.token);
  if (!tokenValidation.isValid) {
    errors.token = tokenValidation.message;
  }

  const passwordValidation = validatePassword(data.newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.message;
  }

  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate refresh token request
 * @param {string} refreshToken - Refresh token to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validateRefreshToken = (refreshToken) => {
  if (!refreshToken) {
    return { isValid: false, message: "Refresh token is required" };
  }

  if (typeof refreshToken !== 'string') {
    return { isValid: false, message: "Invalid refresh token format" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate role
 * @param {string} role - Role to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
const validateRole = (role) => {
  if (!role) {
    return { isValid: false, message: 'Role is required' };
  }
  if (!VALID_ROLES.includes(role)) {
    return { isValid: false, message: 'Invalid role' };
  }
  return { isValid: true };
};

/**
 * Validate admin creation request
 * @param {Object} data - Admin data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
const validateAdminCreation = (data) => {
  const errors = {};

  // Basic validations
  if (!validateEmail(data.email).isValid) {
    errors.email = validateEmail(data.email).message;
  }

  if (!validatePassword(data.password).isValid) {
    errors.password = validatePassword(data.password).message;
  }

  // Role validation
  const roleValidation = validateRole(data.role);
  if (!roleValidation.isValid) {
    errors.role = roleValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateOTP,
  validateName,
  validatePhoneNumber,
  validateToken,
  validateSignupRequest,
  validateLoginRequest,
  validateResetRequest,
  validateRefreshToken,
  validateRole,
  validateAdminCreation,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  VALID_ROLES
};