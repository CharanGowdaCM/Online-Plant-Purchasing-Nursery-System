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
  validatePassword,
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
  validateRequest((data) => {
    const emailValid = validateEmail(data.email);
    const otpValid = validateOTP(data.otp);
    const passwordValid = validatePassword(data.password);
    
    return {
      isValid: emailValid.isValid && otpValid.isValid && passwordValid.isValid,
      errors: {
        ...(!emailValid.isValid && { email: emailValid.message }),
        ...(!otpValid.isValid && { otp: otpValid.message }),
        ...(!passwordValid.isValid && { password: passwordValid.message })
      }
    };
  }),
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