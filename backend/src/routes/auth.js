
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

router.post("/signup/send-otp", 
  validateRequest((data) => {
    const emailValid = validateEmail(data.email);
    const passwordValid = validatePassword(data.password);
    
    return {
      isValid: emailValid.isValid  && passwordValid.isValid,
      errors: {
        ...(!emailValid.isValid && { email: emailValid.message }),
        ...(!passwordValid.isValid && { password: passwordValid.message })
      }
    };
  }),
  authController.sendSignupOTP
);

router.post("/signup/verify", 
  validateRequest((data) => {
    const otpValid = validateOTP(data.otp);
    
    return {
      isValid: otpValid.isValid,
      errors: {
        ...(!otpValid.isValid && { otp: otpValid.message }),
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

router.post("/logout", verifyToken, authController.logout);

// Create admin (only accessible to super_admin via controller check)
router.post(
  "/admin/create",
  verifyToken,
  authController.createAdmin
);

module.exports = router;