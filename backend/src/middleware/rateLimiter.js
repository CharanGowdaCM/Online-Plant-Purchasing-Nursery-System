/*
 Rate limitting middleware
 Author:Akhilesh K
 Features: Rate limiting for API requests
*/

const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 3, 
  message: {
    success: false,
    message: "Too many OTP requests, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3, 
  message: {
    success: false,
    message: "Too many password reset requests, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
};