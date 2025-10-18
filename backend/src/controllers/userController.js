// controllers/userController.js
const UserModel = require('../models/userModel');
const { validateProfile, validateUserStatusUpdate, validateUserRoleUpdate } = require('../utils/validators/userValidator');

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

    const result = await UserModel.saveProfile(req.user.id, req.body);
    
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

module.exports = {
  saveProfile,
  getProfile,
  getUserDetails,
  listUsers,
  updateUserStatus,
  updateUserRole
};