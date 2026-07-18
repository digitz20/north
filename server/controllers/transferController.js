const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// @desc    Get user's transfers (client-side, for logged-in users)
// @route   GET /api/v1/transfers
// @access  Private
exports.getUserTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find({ initiatedBy: req.user.id })
      .populate('sourceAccount', 'accountNumber accountType');
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transfer (client-side, for logged-in users)
// @route   GET /api/v1/transfers/:id
// @access  Private
exports.getUserTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findOne({
      _id: req.params.id,
      initiatedBy: req.user.id
    }).populate('sourceAccount', 'accountNumber accountType');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new transfer (client-side, users can initiate transfers)
// @route   POST /api/v1/transfers
// @access  Private
exports.createTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      sourceAccountId,
      recipientDetails,
      amount,
      transferType,
      proofImageUrl
    } = req.body;

    // Get source account
    const sourceAccount = await Account.findOne({
      _id: sourceAccountId,
      user: req.user.id
    }).session(session);

    if (!sourceAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Source account not found'
      });
    }

    // Check sufficient balance
    if (sourceAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient account balance'
      });
    }

    // Create transfer record
    const transfer = await Transfer.create([{
      initiatedBy: req.user.id,
      sourceAccount: sourceAccountId,
      recipientDetails,
      amount,
      transferType,
      proofImageUrl,
      status: 'pending'
    }], { session });

    // Deduct amount from source account
    sourceAccount.balance -= amount;
    await sourceAccount.save({ session });

    // Create transaction record
    await Transaction.create([{
      sender: { user: req.user.id, account: sourceAccountId },
      recipient: recipientDetails,
      amount,
      type: transferType,
      status: 'pending',
      reference: transfer[0]._id,
      proofImageUrl
    }], { session });

    // Log the action
    await AuditLog.create([{
      user: req.user.id,
      action: `Transfer initiated: $${amount}`,
      description: `User initiated ${transferType} transfer`,
      ipAddress: req.ip
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: transfer[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ------------------------------
// ADMIN-ONLY TRANSFER FUNCTIONS
// ------------------------------
// @desc    Get ALL transfers across all users (admin only)
// @route   GET /api/v1/admin/transfers
// @access  Private/Admin
exports.getAllTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate('initiatedBy', 'firstName lastName email')
      .populate('sourceAccount', 'accountNumber accountType');
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transfer (admin only)
// @route   GET /api/v1/admin/transfers/:id
// @access  Private/Admin
exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('initiatedBy', 'firstName lastName email')
      .populate('sourceAccount', 'accountNumber accountType');
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transfer status (admin only)
// @route   PUT /api/v1/admin/transfers/:id
// @access  Private/Admin
exports.updateTransfer = async (req, res, next) => {
  try {
    const updateableFields = {
      status: req.body.status,
      notes: req.body.notes,
      processedBy: req.user.id
    };
    
    // Remove undefined fields
    Object.keys(updateableFields).forEach(key => 
      updateableFields[key] === undefined && delete updateableFields[key]
    );

    const transfer = await Transfer.findByIdAndUpdate(
      req.params.id, 
      updateableFields, 
      {
        new: true,
        runValidators: true
      }
    ).populate('initiatedBy', 'firstName lastName email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Create audit log
    await AuditLog.create({
      user: req.user.id,
      action: `Updated transfer: ${transfer._id}`,
      description: `Admin updated transfer status to ${transfer.status}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transfer (admin only, super-admin only)
// @route   DELETE /api/v1/admin/transfers/:id
// @access  Private/Super Admin
exports.deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    await Transfer.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user.id,
      action: `Deleted transfer: ${transfer._id}`,
      description: `Super admin deleted transfer record`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Transfer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------
// ROUTE COMPATIBILITY - add all missing functions that transfers.js expects
// ------------------------------
// Alias getUserTransfers to getTransfers for route compatibility
exports.getTransfers = exports.getUserTransfers;
// Rename the admin's getTransfer to avoid conflict, and set client-side getTransfer as the main getTransfer
const adminGetTransfer = exports.getTransfer;
exports.adminGetTransfer = adminGetTransfer;
// Client-side getTransfer is what the route expects
exports.getTransfer = exports.getUserTransfer;

// Add missing createInternationalTransfer function that the route expects
exports.createInternationalTransfer = async (req, res, next) => {
  // Reuse the same createTransfer logic for international transfers
  return exports.createTransfer(req, res, next);
};

// Add missing admin approve/reject functions that the route expects
exports.approveTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', processedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('initiatedBy', 'firstName lastName email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: `Approved transfer: ${transfer._id}`,
      description: `Admin approved transfer of $${transfer.amount}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Refund the amount to source account
    const sourceAccount = await Account.findById(transfer.sourceAccount);
    if (sourceAccount) {
      sourceAccount.balance += transfer.amount;
      await sourceAccount.save();
    }

    await Transfer.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', processedBy: req.user.id, notes: req.body.reason || 'Rejected by admin' },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      user: req.user.id,
      action: `Rejected transfer: ${transfer._id}`,
      description: `Admin rejected transfer`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Transfer rejected and funds refunded'
    });
  } catch (error) {
    next(error);
  }
};

// All functions already exported with exports.* syntax above, no need for redundant module.exports