const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // TODO: Implement getDashboardStats functionality
    res.status(200).json({
      success: true,
      message: 'Get dashboard stats endpoint - functionality not yet implemented',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password -ssnLastFour -twoFactorSecret'); // Exclude sensitive fields
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user with all details
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -ssnLastFour -twoFactorSecret'); // Exclude only the most sensitive fields
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (admins can modify EVERY field)
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fields that admins can modify - EVERY field from the user model
    const updatableFields = {
      // Basic info
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      
      // Address
      address: req.body.address ? {
        street: req.body.address.street || user.address.street,
        city: req.body.address.city || user.address.city,
        state: req.body.address.state || user.address.state,
        zipCode: req.body.address.zipCode || user.address.zipCode,
        country: req.body.address.country || user.address.country
      } : user.address,
      
      // Account status
      role: req.body.role,
      isVerified: req.body.isVerified,
      isActive: req.body.isActive,
      isFrozen: req.body.isFrozen,
      twoFactorEnabled: req.body.twoFactorEnabled
    };

    // Remove undefined fields to preserve existing values
    Object.keys(updatableFields).forEach(key => 
      updatableFields[key] === undefined && delete updatableFields[key]
    );

    // If password is being updated, hash it before saving
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updatableFields.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update the user with ALL requested changes
    user = await User.findByIdAndUpdate(req.params.id, updatableFields, {
      new: true,
      runValidators: true
    }).select('-password -ssnLastFour -twoFactorSecret');

    // Create audit log for admin action
    await AuditLog.create({
      user: req.user.id,
      action: `Updated user: ${user._id}`,
      details: `Admin modified user account: ${user.firstName} ${user.lastName} (${user.email})`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully - all modifications applied',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (super admin only)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Super Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // TODO: Implement deleteUser functionality
    res.status(200).json({
      success: true,
      message: 'Delete user endpoint - functionality not yet implemented'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system logs
// @route   GET /api/v1/admin/logs
// @access  Private/Admin
exports.getSystemLogs = async (req, res, next) => {
  try {
    // TODO: Implement getSystemLogs functionality
    res.status(200).json({
      success: true,
      message: 'Get system logs endpoint - functionality not yet implemented',
      data: []
    });
  } catch (error) {
    next(error);
  }
};