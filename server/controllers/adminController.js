const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Account = require('../models/Account');
const Transfer = require('../models/Transfer');
const SupportTicket = require('../models/SupportTicket');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Loan = require('../models/Loan');
const Investment = require('../models/Investment');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get real counts from the database
    const totalUsers = await User.countDocuments();
    const totalAccounts = await Account.countDocuments();
    const totalTransactions = await Transfer.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAccounts,
        totalTransactions,
        openTickets
      }
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

// @desc    Get single user with ALL related data (accounts, loans, transactions, transfers, investments)
// @route   GET /api/v1/admin/users/:id/details
// @access  Private/Admin
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -ssnLastFour -twoFactorSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [accounts, loans, transactions, transfers, investments] = await Promise.all([
      Account.find({ user: req.params.id }),
      Loan.find({ user: req.params.id }).populate('loanProduct', 'name interestRate'),
      Transaction.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(100),
      Transfer.find({ initiatedBy: req.params.id }).populate('sourceAccount', 'accountNumber accountType').sort({ createdAt: -1 }).limit(100),
      Investment.find({ user: req.params.id }).populate('plan', 'name type expectedReturn').sort({ createdAt: -1 }).limit(100)
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        accounts,
        loans,
        transactions,
        transfers,
        investments
      }
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
    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: `Updated user: ${user._id}`,
      category: 'user-management',
      description: `Admin modified user account: ${user.firstName} ${user.lastName} (${user.email})`,
      entity: { type: 'user', id: user._id, name: user.fullName }
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.params.id).session(session);
    
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admins unless it's a super admin doing it
    if (user.role === 'super-admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin accounts'
      });
    }

    // Delete all user-related data
    await Account.deleteMany({ user: user._id }).session(session);
    await Transaction.deleteMany({ 'sender.user': user._id }).session(session);
    await Notification.deleteMany({ user: user._id }).session(session);
    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: `Deleted user: ${user.email}`,
      category: 'user-management',
      description: `Super admin deleted user account: ${user.fullName} (${user.email})`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    }, { session });

    // Delete the user itself
    await User.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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