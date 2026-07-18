const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get all user accounts (client-side, for logged-in users)
// @route   GET /api/v1/accounts
// @access  Private
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user.id });
    const total = accounts.length;

    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'accounts_viewed',
      category: 'account-management',
      description: `User viewed their accounts`,
      entity: { type: 'user', id: req.user.id }
    });

    res.status(200).json({
      success: true,
      data: { accounts, total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single account (client-side, for logged-in users)
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountType, currency } = req.body;
    
    // Create new account
    const account = await Account.create([{
      user: req.user.id,
      accountType,
      currency: currency || 'USD',
      balance: 0,
      accountStatus: 'active'
    }], { session });

    await AuditLog.create([{
      user: req.user.id,
      action: 'account_created',
      description: `User created new ${accountType} account`,
      ipAddress: req.ip
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: account[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Update account (client-side, limited updates)
// @route   PUT /api/v1/accounts/:id
// @access  Private
exports.updateAccount = async (req, res, next) => {
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

    // Users can only update limited fields (nickname, etc.)
    const updateableFields = {
      nickname: req.body.nickname
    };

    Object.keys(updateableFields).forEach(key => 
      updateableFields[key] === undefined && delete updateableFields[key]
    );

    const updatedAccount = await Account.findByIdAndUpdate(
      req.params.id,
      updateableFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedAccount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Close account (client-side, users can delete their own accounts)
// @route   DELETE /api/v1/accounts/:id
// @access  Private
exports.deleteAccount = async (req, res, next) => {
// Alias for route compatibility (route uses closeAccount)
exports.closeAccount = exports.deleteAccount;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Delete all transactions linked to this account
    await Transaction.deleteMany({
      $or: [
        { 'source.account': account._id },
        { 'destination.account': account._id }
      ]
    }).session(session);

    await Account.findByIdAndDelete(req.params.id).session(session);

    await AuditLog.create([{
      user: req.user.id,
      action: 'account_deleted',
      description: `User deleted their account`,
      ipAddress: req.ip
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ------------------------------
// ADMIN-ONLY ACCOUNT FUNCTIONS
// ------------------------------
// @desc    Get ALL accounts across all users (admin only)
// @route   GET /api/v1/admin/accounts
// @access  Private/Admin
exports.getAdminAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find()
      .populate('user', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update any account (admin only)
// @route   PUT /api/v1/admin/accounts/:id
// @access  Private/Admin
exports.updateAdminAccount = async (req, res, next) => {
  try {
    const updateableFields = {
      balance: req.body.balance,
      accountStatus: req.body.accountStatus,
      isLocked: req.body.isLocked,
      notes: req.body.notes,
      processedBy: req.user.id
    };
    
    // Remove undefined fields
    Object.keys(updateableFields).forEach(key => 
      updateableFields[key] === undefined && delete updateableFields[key]
    );

    const account = await Account.findByIdAndUpdate(
      req.params.id, 
      updateableFields, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'firstName lastName email');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: `Updated account: ${account.accountNumber}`,
      description: `Admin updated account status/balance`,
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

// @desc    Delete account (admin only, super-admin only)
// @route   DELETE /api/v1/admin/accounts/:id
// @access  Private/Super Admin
exports.deleteAdminAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await Account.findById(req.params.id).session(session);
    
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Delete all transactions linked to this account
    await Transaction.deleteMany({
      $or: [
        { 'source.account': account._id },
        { 'destination.account': account._id }
      ]
    }).session(session);

    // Delete the account
    await Account.findByIdAndDelete(req.params.id).session(session);

    await AuditLog.create({
      user: req.user.id,
      action: `Deleted account: ${account.accountNumber}`,
      description: `Super admin deleted user account`,
      ipAddress: req.ip
    }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Account and all associated transactions deleted'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Freeze account (admin only)
// @route   PUT /api/v1/accounts/admin/:id/freeze
// @access  Private/Admin
exports.freezeAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    account.isLocked = true;
    account.accountStatus = 'frozen';
    await account.save();

    await AuditLog.create({
      user: req.user.id,
      action: `Froze account: ${account.accountNumber}`,
      description: `Admin froze user account`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Account frozen successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfreeze account (admin only)
// @route   PUT /api/v1/accounts/admin/:id/unfreeze
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

    account.isLocked = false;
    account.accountStatus = 'active';
    await account.save();

    await AuditLog.create({
      user: req.user.id,
      action: `Unfroze account: ${account.accountNumber}`,
      description: `Admin unfroze user account`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Account unfrozen successfully'
    });
  } catch (error) {
    next(error);
  }
};

// All functions already exported with exports.* syntax above, no need for redundant module.exports