// controllers/authController.js
require('dotenv').config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const AuthModel = require("../models/authModel");
const { activeSessions } = require("../middleware/auth");

// Constants
const OTP_EXPIRY_MINUTES = 5;
const PASSWORD_RESET_EXPIRY_MINUTES = 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_OTP_ATTEMPTS = 3;
const BCRYPT_SALT_ROUNDS = 10;

// Create email transporter directly
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate tokens using env variables directly
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 */
const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "Your OTP Code - Online Nursery",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to Online Plant Nursery! 🌱</h2>
        <p>Your OTP code is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 */
const sendWelcomeEmail = async (email) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "Welcome to Our Online Nursery 🌱",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to Online Plant Nursery!</h2>
        <p>Thank you for joining our community of plant lovers!</p>
        <p>You can now login and start exploring our collection of beautiful plants.</p>
        <p>Happy planting! 🌿</p>
      </div>
    `,
  });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (email, token) => {
  const resetLink = ` ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "Password Reset Request 🌱",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #4CAF50;">Password Reset Request</h3>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
        <p style="color: #ff6b6b; font-weight: bold;">⚠ This link will expire in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `,
  });
};

/**
 * Send password changed confirmation email
 * @param {string} email - Recipient email
 */
const sendPasswordChangedEmail = async (email) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "Password Changed Successfully 🌱",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #4CAF50;">Password Changed Successfully</h3>
        <p>Your password has been changed successfully!</p>
        <p>You can now login with your new password.</p>
        <p style="color: #ff6b6b;">⚠ If you didn't make this change, please contact our support team immediately.</p>
      </div>
    `,
  });
};

/**
 * @route   POST /api/auth/signup/send-otp
 * @desc    Send OTP for signup verification
 * @access  Public
 */
const sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid email is required" 
      });
    }

    // Check if user already exists
    const userExists = await AuthModel.userExists(email);
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: "An account with this email already exists. Please login." 
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to database
    await AuthModel.createOTP(email, otp, expiresAt);

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({ 
      success: true, 
      message: "OTP sent to email successfully",
      expiresIn: OTP_EXPIRY_MINUTES * 60 // seconds
    });
  } catch (err) {
    console.error("Error in sendSignupOTP:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send OTP. Please try again." 
    });
  }
};

/**
 * @route   POST /api/auth/signup/verify-otp
 * @desc    Verify OTP and create user account
 * @access  Public
 */
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Validate input
    if (!email || !otp || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, OTP, and password are required" 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ 
        success: false, 
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }
     console.log("done1");
    // Check if user already exists
    //const userExists = await AuthModel.userExists(email);
    // if (userExists) {
    //    console.log("done2");
    //   return res.status(400).json({
    //     success: false,
    //     message: "An account with this email already exists. Please log in.",
    //   });
    // }

    // Verify OTP
    const otpData = await AuthModel.findOTPByEmail(email);
     console.log("done3");
    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP not found or expired. Please request a new OTP." 
      });
    }
     console.log("done4");
    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
      await AuthModel.deleteOTP(email);
      return res.status(400).json({ 
        success: false, 
        message: "Maximum OTP attempts exceeded. Please request a new OTP." 
      });
    }
     console.log("done5");
    if (new Date() > new Date(otpData.expires_at)) {
      await AuthModel.deleteOTP(email);
      return res.status(400).json({ 
        success: false, 
        message: "OTP expired. Please request a new one." 
      });
    }

    if (otpData.otp !== otp) {
      await AuthModel.incrementOTPAttempts(email, otpData.attempts);
      const remainingAttempts = MAX_OTP_ATTEMPTS - otpData.attempts - 1;
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
      });
    }
    console.log("done6");
    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    
    const newUser = await AuthModel.createUser({
      email,
      password_hash: hashedPassword,
      is_verified: true,
      role: "customer"
    });

    // Delete used OTP
    await AuthModel.deleteOTP(email);

    // Send welcome email (don't wait for it)
     console.log("done8");
    sendWelcomeEmail(email).catch(err => 
      console.error("Error sending welcome email:", err)
    );

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully! Please login.",
      user: {
        id: newUser.id,
        email: newUser.email
      }
    });
  } catch (err) {
     console.log("done9");
    console.error("Error in verifySignupOTP:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create account. Please try again." 
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("here21")
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    console.log("here22")
    // Fetch user from database
    const user = await AuthModel.findUserByEmail(email);
    console.log("here2-2")
    if (!user) {
      console.log("here23")
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
    console.log("here24")
    // Check if user is active
    if (!user.is_active) {
      console.log("here25")
      return res.status(403).json({ 
        success: false, 
        message: "Your account has been deactivated. Please contact support." 
      });
    }

    // Verify password
    console.log("here26")
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log("here27")
    if (!isPasswordValid) {
      console.log("here28")
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
    console.log("here28")
    // Check if user is already logged in on another device
    if (activeSessions.has(user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Account already logged in on another device. Please logout first." 
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Track active session with device info
    activeSessions.set(user.id, {
      timestamp: Date.now(),
      userAgent: req.headers['user-agent']
    });

    // Update last login (don't wait for it)
    AuthModel.updateLastLogin(user.id).catch(err =>
      console.error("Error updating last login:", err)
    );

    res.json({ 
      success: true, 
      message: "Login successful",
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified
      }
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(500).json({ 
      success: false, 
      message: "Login failed. Please try again." 
    });
  }
};

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Refresh token is required" 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    // Check if session is still active
    if (!activeSessions.has(decoded.id)) {
      return res.status(401).json({ 
        success: false, 
        message: "Session expired. Please login again." 
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded);
    
    res.json({ 
      success: true,
      message: "Token refreshed successfully",
      ...tokens 
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid refresh token" 
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Refresh token expired. Please login again." 
      });
    }
    console.error("Error in refreshToken:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to refresh token" 
    });
  }
};


const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Remove from active sessions
    activeSessions.delete(userId);
    
    res.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (err) {
    console.error("Error in logout:", err);
    res.status(500).json({ 
      success: false, 
      message: "Logout failed" 
    });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid email is required" 
      });
    }

    // Check if user exists
    const userExists = await AuthModel.userExists(email);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

    // Save reset token
    await AuthModel.createPasswordResetToken(email, token, expiresAt);

    // Send reset email
    await sendPasswordResetEmail(email, token);

    res.json({ 
      success: true, 
      message: "Password reset link sent to your email!",
      expiresIn: PASSWORD_RESET_EXPIRY_MINUTES * 60 // seconds
    });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send password reset link. Please try again." 
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Token, new password, and confirm password are required" 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Passwords do not match" 
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least ${MIN_PASSWORD_LENGTH} characters '
      });
    }

    // Verify reset token
    const resetData = await AuthModel.findPasswordResetToken(token);

    if (!resetData) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset link" 
      });
    }

    if (new Date() > new Date(resetData.expires_at)) {
      await AuthModel.deletePasswordResetToken(resetData.email);
      return res.status(400).json({ 
        success: false, 
        message: "Reset link has expired. Please request a new one." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update user password
    await AuthModel.updatePassword(resetData.email, hashedPassword);

    // Mark reset token as used
    await AuthModel.markPasswordResetTokenAsUsed(token);

    // Send confirmation email (don't wait for it)
    sendPasswordChangedEmail(resetData.email).catch(err =>
      console.error("Error sending password changed email:", err)
    );

    res.json({ 
      success: true, 
      message: 'Password changed successfully! You can now login with your new password.'
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset password. Please try again." 
    });
  }
};

// Add new admin management methods

const createAdmin = async (req, res) => {
  try {
    const validation = validateAdminCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const { email, password, role } = req.body;
    
    // Only super_admin can create other admins
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Only super admin can create admin accounts"
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const admin = await AuthModel.createAdmin({
      email,
      password_hash: hashedPassword,
      role
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: { id: admin.id, email: admin.email, role: admin.role }
    });
  } catch (error) {
    next(error);
  }
};

// Add to existing exports
module.exports = {
  sendSignupOTP,
  verifySignupOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  createAdmin
};