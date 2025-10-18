// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const {
  validateSignupRequest,
  validateLoginRequest,
  validateEmail,
  validateOTP,
  validateResetRequest,
  validateRefreshToken
} = require("../utils/validators/authValidator");

// Validation middleware
const validateRequest = (validator) => async (req, res, next) => {
  const result = validator(req.body);
  if (!result.isValid) {
    return res.status(400).json({ 
      success: false, 
      errors: result.errors 
    });
  }
  next();
};

// Public routes
router.post("/signup/send-otp", 
  validateRequest((data) => validateEmail(data.email)),
  authController.sendSignupOTP
);

router.post("/signup/verify", 
  validateRequest((data) => ({
    isValid: validateEmail(data.email).isValid && validateOTP(data.otp).isValid,
    errors: {
      ...(!validateEmail(data.email).isValid && { email: validateEmail(data.email).message }),
      ...(!validateOTP(data.otp).isValid && { otp: validateOTP(data.otp).message })
    }
  })),
  authController.verifySignupOTP
);

router.post("/login",
  validateRequest(validateLoginRequest),
  authController.login
);

router.post("/token/refresh",
  validateRequest((data) => validateRefreshToken(data.refreshToken)),
  authController.refreshToken
);

router.post("/forgot-password",
  validateRequest((data) => validateEmail(data.email)),
  authController.forgotPassword
);

router.post("/reset-password",
  validateRequest(validateResetRequest),
  authController.resetPassword
);

// Protected routes
router.post("/logout", verifyToken, authController.logout);

module.exports = router;