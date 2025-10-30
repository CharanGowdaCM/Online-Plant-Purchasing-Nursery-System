/*
 User Controller - User management operations
 Author: Akhilesh K
 Features: Profile management, User listing, Status and role updates, Email change with OTP verification
*/
const UserModel = require('../models/userModel');
const supabase = require('../config/supabase');
const { 
  validateProfile, 
  validateUserStatusUpdate, 
  validateUserRoleUpdate 
} = require('../utils/validators/userValidator');
const { sendEmailVerificationOTP, sendRoleUpdateNotification } = require('../utils/notifications');
const { recordActivity } = require('../utils/activityRecorder.js');

const saveProfile = async (req, res) => {
  try {
    const validation = validateProfile(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    let userId;

    if (req.user?.id) {
      userId = req.user.id;
    } else if (req.body.email) {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', req.body.email)
        .single();

      if (error || !data) {
        console.error('Error finding user:', error);
        return res.status(404).json({
          success: false,
          message: 'User not found. Please complete signup first.'
        });
      }
      userId = data.id;
    } else {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    const result = await UserModel.saveProfile(userId, req.body);

    // Log profile update activity
    recordActivity(req, 'UPDATE', 'UserProfile', userId, {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      updated_fields: Object.keys(req.body).join(',')
    });

    res.json({
      success: true,
      message: `Profile ${result} successfully`
    });
  } catch (err) {
    console.error('Error in saveProfile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await UserModel.getProfileByUserId(req.user.id);
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
    console.log('Total users found:', users);

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
    const validation = validateUserRoleUpdate(
      req.body,
      ['customer', 'inventory_admin', 'order_admin', 'support_admin', 'content_admin']
    );

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

    // Fetch user details before updating role
    const userDetails = await UserModel.getUserDetailsById(req.params.userId);
    
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = userDetails.role;
    const newRole = req.body.role;

    // Update user role
    await UserModel.updateUserRole(req.params.userId, newRole);

    // Send role update notification email (async, don't wait)
    sendRoleUpdateNotification(userDetails, newRole, oldRole)
      .catch(err => console.error('Error sending role update email:', err));

    res.json({
      success: true,
      message: `User role updated to ${newRole} successfully`
    });
  } catch (err) {
    console.error('Error in updateUserRole:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail)
      return res.status(400).json({ success: false, message: 'New email required' });

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

const verifyEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const updated = await UserModel.verifyEmailOTP(req.user.id, otp);

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const userDetails = await UserModel.getUserDetailsById(req.user.id);

    recordActivity(req, 'UPDATE', 'UserEmail', req.user.id, {
      new_email: userDetails.email,
      change_time: new Date().toISOString()
    });

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
