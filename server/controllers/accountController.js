const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get all user accounts
// @route   GET /api/v1/accounts
// @access  Private
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user.id });
    const total = accounts.length;

    await AuditLog.create({
      user: req.user.id,
      action: 'accounts_viewed',
      description: `User viewed their accounts`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: { accounts, total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single account
// @route   GET /api/v1/accounts/:id
// @access  Private
exports.getAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'account_viewed',
      description: `User viewed account ${account.nickname}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new account
// @route   POST /api/v1/accounts
// @access  Private
exports.createAccount = async (req, res, next) => {
  try {
    const { accountType, nickname } = req.body;
    
    // Validate account type
    const validAccountTypes = ['checking', 'savings', 'cd', 'money_market'];
    if (!validAccountTypes.includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type'
      });
    }

    const account = await Account.create({
      user: req.user.id,
      accountType,
      nickname: nickname || `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
      balance: 0,
      interestRate: accountType === 'savings' ? 0.5 : (accountType === 'cd' ? 2.5 : 0)
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'account_created',
      description: `User created new ${accountType} account: ${account.nickname}`,
      ipAddress: req.ip
    });

    // Send notification to user
    await Notification.create({
      user: req.user.id,
      type: 'account_update',
      title: 'New Account Created',
      message: `Your new ${account.nickname} has been successfully created.`,
      relatedModel: 'Account',
      relatedId: account._id
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account
// @route   PUT /api/v1/accounts/:id
// @access  Private
exports.updateAccount = async (req, res, next) => {
  try {
    const { nickname, isPrimary } = req.body;
    let account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // If setting as primary, unset others
    if (isPrimary) {
      await Account.updateMany(
        { user: req.user.id, _id: { $ne: account._id } },
        { isPrimary: false }
      );
    }

    // Update account fields
    account = await Account.findByIdAndUpdate(
      req.params.id,
      { nickname, isPrimary },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      user: req.user.id,
      action: 'account_updated',
      description: `User updated account ${account.nickname}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close account
// @route   DELETE /api/v1/accounts/:id
// @access  Private
exports.closeAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Cannot close primary account
    if (account.isPrimary) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot close your primary account'
      });
    }

    // Cannot close account with remaining balance
    if (account.balance > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot close account with remaining balance. Please transfer funds first.'
      });
    }

    // Soft delete - mark as closed instead of removing
    await Account.findByIdAndUpdate(
      req.params.id,
      { isActive: false, closedAt: Date.now() }
    );

    await AuditLog.create({
      user: req.user.id,
      action: 'account_closed',
      description: `User closed account ${account.nickname}`,
      ipAddress: req.ip
    });

    await Notification.create({
      user: req.user.id,
      type: 'account_update',
      title: 'Account Closed',
      message: `Your ${account.nickname} has been successfully closed.`,
      relatedModel: 'Account',
      relatedId: account._id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Account closed successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Admin-only: Freeze account
// @desc    Freeze user account (admin only)
// @route   PUT /api/v1/admin/accounts/:id/freeze
// @access  Private/Admin
exports.freezeAccount = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    await Account.findByIdAndUpdate(
      req.params.id,
      { isFrozen: true, freezeReason: reason }
    );

    // Also freeze user's overall status
    await User.findByIdAndUpdate(
      account.user,
      { isFrozen: true }
    );

    await AuditLog.create({
      user: req.user.id,
      action: 'account_frozen',
      description: `Admin froze account ${account.nickname}. Reason: ${reason}`,
      ipAddress: req.ip
    });

    await Notification.create({
      user: account.user,
      type: 'security_alert',
      title: 'Account Frozen',
      message: `Your account has been frozen. Reason: ${reason}. Please contact support.`,
      relatedModel: 'Account',
      relatedId: account._id
    });

    res.status(200).json({
      success: true,
      message: 'Account frozen successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only: Unfreeze account
// @desc    Unfreeze user account (admin only)
// @route   PUT /api/v1/admin/accounts/:id/unfreeze
// @access  Private/Admin
exports.unfreezeAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    await Account.findByIdAndUpdate(
      req.params.id,
      { isFrozen: false, freezeReason: null }
    );

    // Check if all user accounts are unfrozen before unfreezing user
    const activeFrozenAccounts = await Account.countDocuments({
      user: account.user,
      isFrozen: true,
      _id: { $ne: account._id }
    });

    if (activeFrozenAccounts === 0) {
      await User.findByIdAndUpdate(
        account.user,
        { isFrozen: false }
      );
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'account_unfrozen',
      description: `Admin unfroze account ${account.nickname}`,
      ipAddress: req.ip
    });

    await Notification.create({
      user: account.user,
      type: 'account_update',
      title: 'Account Unfrozen',
      message: `Your account has been unfrozen and you can resume normal operations.`,
      relatedModel: 'Account',
      relatedId: account._id
    });

    res.status(200).json({
      success: true,
      message: 'Account unfrozen successfully'
    });
  } catch (error) {
    next(error);
  }
};