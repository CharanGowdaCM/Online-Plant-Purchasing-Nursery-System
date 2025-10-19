// controllers/userController.js
const UserModel = require('../models/userModel');
const { validateProfile, validateUserStatusUpdate, validateUserRoleUpdate } = require('../utils/validators/userValidator');
const {sendEmailVerificationOTP} = require('../utils/notifications');

// Save or update user profile
const saveProfile = async (req, res) => {
  try {
    const validation = validateProfile(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // For initial profile creation after signup, email will be included in the request
    const userId = req.user?.id || (await UserModel.getUserIdByEmail(req.body.email));
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await UserModel.saveProfile(userId, req.body);
    
    res.json({
      success: true,
      message: `Profile ${result} successfully`
    });
  } catch (err) {
    console.error('Error in saveProfile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const profile = await UserModel.getProfileByUserId(req.user.id);
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin only controllers
const getUserDetails = async (req, res) => {
  try {
    const user = await UserModel.getUserDetailsById(req.params.userId);
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error in getUserDetails:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, is_active } = req.query;
    const { users, count } = await UserModel.listUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      is_active: is_active === 'true'
    });

    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Error in listUsers:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const validation = validateUserStatusUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    await UserModel.updateUserStatus(req.params.userId, req.body.is_active);
    
    res.json({
      success: true,
      message: `User ${req.body.is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err) {
    console.error('Error in updateUserStatus:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const validation = validateUserRoleUpdate(req.body, ['customer', 'inventory_admin', 'order_admin', 'support_admin', 'content_admin']);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    await UserModel.updateUserRole(req.params.userId, req.body.role);
    
    res.json({
      success: true,
      message: `User role updated to ${req.body.role} successfully`
    });
  } catch (err) {
    console.error('Error in updateUserRole:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } 
};


const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, message: 'New email required' });

    const otp = await UserModel.requestEmailChange(req.user.id, newEmail);
    await sendEmailVerificationOTP(newEmail, otp);

    res.json({
      success: true,
      message: 'OTP sent to your new email. Please verify to update.'
    });
  } catch (err) {
    console.error('Error in requestEmailChange:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify email OTP
const verifyEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const updated = await UserModel.verifyEmailOTP(req.user.id, otp);

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    res.json({
      success: true,
      message: 'Email updated successfully. You can now login using the new email.'
    });
  } catch (err) {
    console.error('Error in verifyEmailOTP:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  saveProfile,
  getProfile,
  getUserDetails,
  listUsers,
  updateUserStatus,
  updateUserRole,
  requestEmailChange,
  verifyEmailOTP
};