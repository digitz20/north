const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

// @desc    Get all user transfers
// @route   GET /api/v1/transfers
// @access  Private
exports.getTransfers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    
    // Get user's account IDs to filter transfers
    const userAccounts = await Account.find({ user: req.user.id }).select('_id');
    const userAccountIds = userAccounts.map(account => account._id);
    filters.$or = [
      { sourceAccount: { $in: userAccountIds } },
      { destinationAccount: { $in: userAccountIds } }
    ];

    const total = await Transfer.countDocuments(filters);
    const transfers = await Transfer.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('sourceAccount', 'accountType nickname')
      .populate('destinationAccount', 'accountType nickname');

    await AuditLog.create({
      user: req.user.id,
      action: 'transfers_viewed',
      description: `User viewed their transfer history`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: { transfers, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transfer
// @route   GET /api/v1/transfers/:id
// @access  Private
exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('sourceAccount', 'accountType nickname')
      .populate('destinationAccount', 'accountType nickname');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Verify user has access to this transfer
    const userAccounts = await Account.find({ user: req.user.id }).select('_id');
    const userAccountIds = userAccounts.map(account => account._id.toString());
    const sourceIsUser = transfer.sourceAccount && userAccountIds.includes(transfer.sourceAccount._id.toString());
    const destIsUser = transfer.destinationAccount && userAccountIds.includes(transfer.destinationAccount._id.toString());
    
    if (!sourceIsUser && !destIsUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transfer'
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'transfer_viewed',
      description: `User viewed transfer ${req.params.id}`,
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

// @desc    Create a new transfer
// @route   POST /api/v1/transfers
// @access  Private
exports.createTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sourceAccountId, destinationAccountId, amount, note } = req.body;
    
    // Validate required fields
    if (!sourceAccountId || !destinationAccountId || !amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide source account, destination account, and amount'
      });
    }

    // Verify source account belongs to user
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
        message: 'Insufficient funds for this transfer'
      });
    }

    // Get destination account
    const destinationAccount = await Account.findById(destinationAccountId).session(session);
    if (!destinationAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }

    // Create transfer record
    const transfer = await Transfer.create([{
      sourceAccount: sourceAccountId,
      destinationAccount: destinationAccountId,
      amount,
      note,
      status: 'completed',
      initiatedBy: req.user.id
    }], { session });

    // Update account balances
    await Account.findByIdAndUpdate(
      sourceAccountId,
      { $inc: { balance: -amount } },
      { new: true, session }
    );

    await Account.findByIdAndUpdate(
      destinationAccountId,
      { $inc: { balance: amount } },
      { new: true, session }
    );

    // Create transaction records for both accounts
    await Transaction.create([{
      sourceAccount: sourceAccountId,
      destinationAccount: destinationAccountId,
      amount,
      type: 'transfer_out',
      status: 'completed',
      description: note || `Transfer to ${destinationAccount.nickname}`
    }], { session });

    await AuditLog.create([{
      user: req.user.id,
      action: 'transfer_initiated',
      description: `User initiated transfer of $${amount} from ${sourceAccount.nickname} to ${destinationAccount.nickname}`,
      ipAddress: req.ip
    }], { session });

    // Send notifications
    await Notification.create([{
      user: req.user.id,
      type: 'transfer_sent',
      title: 'Transfer Successful',
      message: `$${amount} has been sent from ${sourceAccount.nickname} to ${destinationAccount.nickname}`,
      relatedModel: 'Transfer',
      relatedId: transfer[0]._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: transfer[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Create international transfer
// @route   POST /api/v1/transfers/international
// @access  Private
exports.createInternationalTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, destinationAccountId, method, source, recipient, proofs } = req.body;
    
    // Find destination account
    const account = await Account.findById(destinationAccountId).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }

    // Verify account belongs to user
    if (account.user.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to use this account'
      });
    }

    // Create transfer record
    const transfer = await Transfer.create([{
      amount,
      sourceAccount: account._id,
      destinationAccount: destinationAccountId,
      transferType: 'international',
      method,
      sourceDetails: source,
      recipientDetails: recipient,
      proofs,
      status: 'pending',
      initiatedBy: req.user.id
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'international-transfer-initiated',
      title: 'International Transfer Initiated',
      message: `Your international transfer of $${amount} to ${recipient.name} has been initiated.`,
      relatedModel: 'Transfer',
      relatedId: transfer[0]._id
    }], { session });

    // Send confirmation email
    const user = await User.findById(req.user.id).session(session);
    if (user) {
      await emailService.sendTransactionAlert(user, {
        ...transfer[0].toObject(),
        direction: 'sent',
        type: 'International Transfer',
        description: `Your international transfer to ${recipient.name} has been initiated`
      });
    }

    await AuditLog.create([{
      user: req.user.id,
      action: 'international_transfer_initiated',
      description: `User initiated international transfer of $${amount} via ${method}`,
      ipAddress: req.ip
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'International transfer initiated successfully',
      data: transfer[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all transfers (admin only)
// @route   GET /api/v1/transfers/admin/all
// @access  Private/Admin
exports.getAllTransfers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.startDate) filters.createdAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) filters.createdAt = { ...filters.createdAt, $lte: new Date(req.query.endDate) };

    const total = await Transfer.countDocuments(filters);
    const transfers = await Transfer.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('sourceAccount', 'accountType nickname user')
      .populate('destinationAccount', 'accountType nickname user')
      .populate('initiatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: { transfers, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a transfer (admin only)
// @route   PUT /api/v1/transfers/admin/:id/approve
// @access  Private/Admin
exports.approveTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let transfer = await Transfer.findById(req.params.id).session(session);
    
    if (!transfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot approve a transfer with status: ${transfer.status}`
      });
    }

    // Update transfer status
    transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', processedAt: Date.now(), processedBy: req.user.id },
      { new: true, runValidators: true, session }
    ).populate('sourceAccount destinationAccount');

    // Update account balances
    await Account.findByIdAndUpdate(
      transfer.sourceAccount._id,
      { $inc: { balance: -transfer.amount } },
      { session }
    );

    await Account.findByIdAndUpdate(
      transfer.destinationAccount._id,
      { $inc: { balance: transfer.amount } },
      { session }
    );

    await AuditLog.create([{
      user: req.user.id,
      action: 'transfer_approved',
      description: `Admin approved transfer ${transfer._id}`,
      ipAddress: req.ip
    }], { session });

    // Notify user
    await Notification.create([{
      user: transfer.initiatedBy,
      type: 'transfer_approved',
      title: 'Transfer Approved',
      message: `Your transfer of $${transfer.amount} has been approved and processed.`,
      relatedModel: 'Transfer',
      relatedId: transfer._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Transfer approved and processed',
      data: transfer
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Reject a transfer (admin only)
// @route   PUT /api/v1/transfers/admin/:id/reject
// @access  Private/Admin
exports.rejectTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rejectionReason } = req.body;
    let transfer = await Transfer.findById(req.params.id).session(session);
    
    if (!transfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot reject a transfer with status: ${transfer.status}`
      });
    }

    // Update transfer status
    transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected', 
        rejectionReason,
        processedAt: Date.now(), 
        processedBy: req.user.id 
      },
      { new: true, runValidators: true, session }
    );

    await AuditLog.create([{
      user: req.user.id,
      action: 'transfer_rejected',
      description: `Admin rejected transfer ${transfer._id}: ${rejectionReason}`,
      ipAddress: req.ip
    }], { session });

    // Notify user
    await Notification.create([{
      user: transfer.initiatedBy,
      type: 'transfer_rejected',
      title: 'Transfer Rejected',
      message: `Your transfer has been rejected. Reason: ${rejectionReason}`,
      relatedModel: 'Transfer',
      relatedId: transfer._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Transfer rejected',
      data: transfer
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};