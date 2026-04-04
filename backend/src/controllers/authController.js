/*
 Auth Controller - Handles user authentication
 Author: K Akhilesh
 Features: Login, Register, Password reset
*/

require('dotenv').config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const AuthModel = require("../models/authModel");
const UserModel = require("../models/userModel");
const { activeSessions } = require("../middleware/auth");
const { recordActivity } = require('../utils/activityRecorder.js');
const { validateAdminCreation} = require('../utils/validators/authValidator');
const { sendAdminWelcomeNotification } = require('../utils/notifications');

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

// Email styles and templates
const emailStyles = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .email-wrapper { background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 40px 20px; }
  .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(76, 175, 80, 0.1); }
  .header { background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); padding: 40px 30px; text-align: center; }
  .logo-section { margin-bottom: 15px; }
  .logo-img { height: 60px; margin-bottom: 10px; }
  .tagline { color: #e8f5e9; font-size: 14px; font-style: italic; margin: 8px 0 0 0; }
  .content { padding: 40px 30px; }
  .greeting { color: #2e7d32; font-size: 18px; margin-bottom: 20px; }
  .message { color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
  .info-box { background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%); border-left: 4px solid #66bb6a; padding: 20px; margin: 25px 0; border-radius: 8px; }
  .info-title { color: #2e7d32; font-size: 18px; font-weight: 600; margin: 0 0 15px 0; }
  .info-item { color: #424242; margin: 10px 0; font-size: 15px; }
  .info-label { color: #558b2f; font-weight: 600; }
  .otp-box { background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%); padding: 25px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 30px 0; border-radius: 12px; color: #2e7d32; border: 2px dashed #66bb6a; }
  .alert-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
  .security-warning { background: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 25px 0; border-radius: 8px; }
  .button { display: inline-block; background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 12px rgba(102, 187, 106, 0.3); }
  .footer { background: #f5f5f5; padding: 30px; text-align: center; color: #757575; font-size: 13px; }
  .footer-links { margin: 15px 0; }
  .footer-link { color: #66bb6a; text-decoration: none; margin: 0 10px; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, #c8e6c9, transparent); margin: 30px 0; }
  .link-box { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; color: #666; font-size: 13px; }
`;

const getEmailHeader = () => `
  <div class="header">
    <div class="logo-section">
      <img src="cid:logo" alt="Bleaf Logo" class="logo-img" />
      <p class="tagline">Nature Knows the Way — Just Bleaf.</p>
    </div>
  </div>
`;

const getEmailFooter = () => `
  <div class="footer">
    <div class="divider"></div>
    <p style="margin: 0 0 10px 0; color: #2e7d32; font-weight: 600;">🌿 Bleaf - Nature's Trusted Choice</p>
    <p style="margin: 10px 0;">If you have any questions, our support team is here to help.</p>
    <div class="footer-links">
      <a href="#" class="footer-link">Contact Support</a> | 
      <a href="#" class="footer-link">Visit Website</a>
    </div>
    <p style="margin-top: 20px; font-size: 12px;">© ${new Date().getFullYear()} Bleaf. All rights reserved.</p>
  </div>
`;

// Generate tokens using env variables directly
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '60m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "🔐 Your Verification Code - Bleaf",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            ${getEmailHeader()}
            
            <div class="content">
              <h2 class="greeting">🔐 Your Verification Code</h2>
              <p class="message">
                Welcome to Bleaf! To complete your registration, please use the verification code below:
              </p>
              
              <div class="otp-box">${otp}</div>
              
              <div class="info-box">
                <p style="margin: 0; color: #558b2f;">
                  <strong>⏱ Important:</strong><br>
                  This code will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. Please enter it promptly to verify your account.
                </p>
              </div>

              <div class="alert-box">
                <p style="margin: 0; color: #e65100; font-size: 14px;">
                  <strong>⚠️ Security Tip:</strong> Never share this code with anyone. Bleaf will never ask you for this code via phone or email.
                </p>
              </div>

              <p class="message" style="font-size: 14px; color: #757575; margin-top: 30px;">
                If you didn't request this code, please ignore this email or contact our support team if you have concerns.
              </p>
            </div>
            
            ${getEmailFooter()}
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'logo.png',
      path: './assets/logo.png',
      cid: 'logo'
    }]
  });
};


const sendWelcomeEmail = async (email) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "🎉 Welcome to Bleaf - Your Natural Wellness Journey Begins!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            ${getEmailHeader()}
            
            <div class="content">
              <h2 class="greeting">🎉 Welcome to Bleaf!</h2>
              <p class="message">
                Thank you for joining our community of plant lovers and wellness enthusiasts!
              </p>
              
              <div class="info-box">
                <h3 class="info-title">✨ What's Next?</h3>
                <p style="margin: 10px 0; color: #424242;">
                  • Explore our collection of premium natural products<br>
                  • Discover wellness tips and plant care guides<br>
                  • Enjoy exclusive member benefits and offers<br>
                  • Join our growing community of nature lovers
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                  Start Exploring 🌿
                </a>
              </div>

              <p class="message" style="text-align: center; font-style: italic; color: #558b2f;">
                "Nature Knows the Way — Just Bleaf."
              </p>
            </div>
            
            ${getEmailFooter()}
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'logo.png',
      path: './assets/logo.png',
      cid: 'logo'
    }]
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "🔑 Password Reset Request - Bleaf",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            ${getEmailHeader()}
            
            <div class="content">
              <h2 class="greeting">🔑 Password Reset Request</h2>
              <p class="message">
                Hello,
              </p>
              <p class="message">
                We received a request to reset your password for your Bleaf account. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">
                  Reset Password
                </a>
              </div>

              <div class="info-box">
                <p style="margin: 0; color: #558b2f;">
                  <strong>⏱ Link Expiry:</strong><br>
                  This password reset link will expire in <strong>${PASSWORD_RESET_EXPIRY_MINUTES} minutes</strong> for security reasons.
                </p>
              </div>

              <p class="message" style="font-size: 14px; color: #666;">
                Or copy and paste this link in your browser:
              </p>
              <div class="link-box">${resetLink}</div>

              <div class="security-warning">
                <p style="margin: 0; color: #c62828; font-size: 14px;">
                  <strong>⚠️ Security Alert:</strong><br>
                  If you didn't request this password reset, please ignore this email and your password will remain unchanged. Consider updating your password if you suspect unauthorized access.
                </p>
              </div>
            </div>
            
            ${getEmailFooter()}
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'logo.png',
      path: './assets/logo.png',
      cid: 'logo'
    }]
  });
};


const sendPasswordChangedEmail = async (email) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "akhileshkoppala@gmail.com",
    to: email,
    subject: "✅ Password Changed Successfully - Bleaf",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            ${getEmailHeader()}
            
            <div class="content">
              <h2 class="greeting">✅ Password Changed Successfully</h2>
              <p class="message">
                Your password has been changed successfully!
              </p>
              
              <div class="info-box">
                <p style="margin: 0; color: #558b2f;">
                  <strong>🔒 Account Security:</strong><br>
                  Your Bleaf account is now secured with your new password. You can login using your updated credentials.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                  Login Now
                </a>
              </div>

              <div class="security-warning">
                <p style="margin: 0; color: #c62828; font-size: 14px;">
                  <strong>⚠️ Didn't make this change?</strong><br>
                  If you didn't change your password, please contact our support team immediately. Your account security is our top priority.
                </p>
              </div>

              <div class="info-box" style="margin-top: 25px;">
                <p style="margin: 0; color: #424242; font-size: 14px;">
                  <strong>💡 Security Tips:</strong><br>
                  • Use a strong, unique password<br>
                  • Never share your password with anyone<br>
                  • Enable two-factor authentication if available<br>
                  • Change your password regularly
                </p>
              </div>
            </div>
            
            ${getEmailFooter()}
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'logo.png',
      path: './assets/logo.png',
      cid: 'logo'
    }]
  });
};

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


const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

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
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newUser = await AuthModel.createUser({
      email,
      password_hash: hashedPassword,
      is_verified: true,
      role: "customer"
    });

    // Delete used OTP
    await AuthModel.deleteOTP(email);

    // Log account creation activity
    if (req.supabase && newUser) {
      const logReq = {
        ...req,
        user: { id: newUser.id }
      };
      recordActivity(logReq, 'CREATE', 'User', newUser.id, {
        email: newUser.email,
        role: 'customer',
        registration_time: new Date().toISOString()
      });
      recordActivity(logReq, 'LOGIN', 'User', newUser.id, {
        email: newUser.email,
        role: 'customer',
        registration_time: new Date().toISOString()
      });
    }

    // Send welcome email (don't wait for it)
     console.log("done8");
    sendWelcomeEmail(email).catch(err => 
      console.error("Error sending welcome email:", err)
    );

    const user = await AuthModel.findUserByEmail(email);
    const tokens = generateTokens(user);

    // Track active session with device info
    activeSessions.set(user.id, {
      timestamp: Date.now(),
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully! Please login.",
      ...tokens,
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
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    
    const user = await AuthModel.findUserByEmail(email);
   console.log('User fetched:', user);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
   
    // Check if user is active
    if (!user.is_active) {
      console.log("here25")
      return res.status(403).json({ 
        success: false, 
        message: "Your account has been deactivated. Please contact support." 
      });
    }

   
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
   
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
   
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

   const previousLoginTime = user.last_login;
   console.log('Previous login time:', previousLoginTime);
    AuthModel.updateLastLogin(user.id).catch(err =>
      console.error("Error updating last login:", err)
    );

    if (req.supabase) {
      const logReq = { ...req, user: { id: user.id } };
      recordActivity(logReq, 'LOGIN', 'User', user.id, {
        email: user.email,
        role: user.role,
        login_time: new Date().toISOString()
      });
    }
   

    res.json({ 
      success: true, 
      message: "Login successful",
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        previousLoginTime: previousLoginTime
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

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Refresh token is required" 
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    
    // Check if session is still active
    if (!activeSessions.has(decoded.id)) {
      return res.status(401).json({ 
        success: false, 
        message: "Session expired. Please login again." 
      });
    }

    // Fetch user from database to get current role using UserModel
    const user = await UserModel.getUserDetailsById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Generate new tokens with complete user data including role
    const tokens = generateTokens(user);
    
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
    
    // Log logout activity
    recordActivity(req, 'LOGOUT', 'User', userId, {
      logout_time: new Date().toISOString()
    });
    
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
      expiresIn: PASSWORD_RESET_EXPIRY_MINUTES * 60 
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

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await AuthModel.updatePassword(resetData.email, hashedPassword);
    await AuthModel.markPasswordResetTokenAsUsed(token);

    const user = await AuthModel.findUserByEmail(resetData.email);
    
    // Log password reset activity
    if (req.supabase && user) {
      // Create a temporary req object with user context for logging
      const logReq = {
        ...req,
        user: { id: user.id }
      };
      recordActivity(logReq, 'PASSWORD_RESET', 'User', user.id, {
        email: resetData.email,
        reset_time: new Date().toISOString()
      });
    }

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
    console.log('createAdmin request body:', req.body);
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

    // Send welcome email to new admin (async, don't wait)
    sendAdminWelcomeNotification(email, password, role).catch(err => 
      console.error('Failed to send admin welcome email:', err)
    );

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: { id: admin.id, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('createAdmin error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
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