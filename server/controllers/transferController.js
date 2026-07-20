const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.initiatedBy) filters.initiatedBy = req.query.initiatedBy;

    const total = await Transfer.countDocuments(filters);
    const transfers = await Transfer.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('initiatedBy', 'firstName lastName email')
      .populate('sourceAccount', 'accountNumber accountType');
    
    res.status(200).json({
      success: true,
      data: { transfers, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get transfer statistics
// @desc    Get transfer statistics across platform (admin only)
// @route   GET /api/v1/admin/transfers/stats
// @access  Private/Admin
exports.getTransferStats = async (req, res, next) => {
  try {
    // Get total transfers count
    const totalTransfers = await Transfer.countDocuments();
    
    // Get transfers by status
    const completedTransfers = await Transfer.countDocuments({ status: 'completed' });
    const pendingTransfers = await Transfer.countDocuments({ status: 'pending' });
    const failedTransfers = await Transfer.countDocuments({ status: 'failed' });
    
    // Get transfers by type
    const domesticTransfers = await Transfer.countDocuments({ transferType: 'domestic' });
    const internationalTransfers = await Transfer.countDocuments({ transferType: 'international' });
    const cryptoTransfers = await Transfer.countDocuments({ method: 'crypto-transfer' });
    
    // Calculate total volume
    let totalVolume = 0;
    let monthlyVolume = 0;
    
    try {
      const transferStats = await Transfer.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$amount' },
            monthlyVolume: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(new Date().setMonth(new Date().getMonth() - 1))] },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]);
      
      if (transferStats.length > 0) {
        totalVolume = transferStats[0].totalVolume || 0;
        monthlyVolume = transferStats[0].monthlyVolume || 0;
      }
    } catch (aggError) {
      logger.warn('Transfer stats aggregation warning:', aggError.message);
    }
    
    const stats = {
      total: totalTransfers,
      completed: completedTransfers,
      pending: pendingTransfers,
      failed: failedTransfers,
      byType: {
        domestic: domesticTransfers,
        international: internationalTransfers,
        crypto: cryptoTransfers
      },
      volume: {
        total: totalVolume,
        monthly: monthlyVolume
      }
    };

    await AuditLog.create({
      user: req.user.id,
      action: 'admin_transfer_stats_viewed',
      description: `Admin viewed transfer statistics`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: stats
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
// System crypto wallet addresses (matches frontend)
const systemCryptoWallets = {
  btc: { address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y', network: 'Bitcoin (BTC)' },
  eth: { address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8', network: 'Ethereum (ERC20)' },
  trx: { address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg', network: 'TRON (TRX)' },
  sol: { address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA', network: 'Solana' },
  bnb: { address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8', network: 'BNB Smart Chain' },
  ltc: { address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks', network: 'Litecoin' },
  doge: { address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX', network: 'Dogecoin' }
};

// Address validation patterns (matches frontend)
const addressValidators = {
  btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  trx: /^T[a-zA-Z0-9]{33}$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
  ltc: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  doge: /^D[5-9A-HJ-NP-Ua-km-z]{33}$/
};

exports.createInternationalTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      amount,
      method,
      source, // { walletAddress, transactionHash, crypto }
      recipient,
      destinationAccountId,
      proofs
    } = req.body;

    // If it's not a crypto transfer, use regular createTransfer logic
    if (method !== 'crypto-transfer') {
      await session.abortTransaction();
      session.endSession();
      return exports.createTransfer(req, res, next);
    }

    // Validate crypto transfer
    if (!source?.crypto || !systemCryptoWallets[source.crypto]) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid cryptocurrency selected'
      });
    }

    // Validate user's wallet address
    if (!source?.walletAddress || !addressValidators[source.crypto].test(source.walletAddress)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid source wallet address for selected cryptocurrency'
      });
    }

    // Get the destination account to deduct funds from
    const destinationAccount = await Account.findOne({
      _id: destinationAccountId,
      user: req.user.id
    }).session(session);

    if (!destinationAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }

    // Check sufficient balance
    if (destinationAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient account balance'
      });
    }

    // Get system wallet for selected crypto
    const systemWallet = systemCryptoWallets[source.crypto];

    // Create transfer record with crypto details
    const transfer = await Transfer.create([{
      initiatedBy: req.user.id,
      sourceAccount: destinationAccountId,
      recipientDetails: {
        ...recipient,
        walletAddress: source.walletAddress,
        transactionHash: source.transactionHash,
        crypto: source.crypto,
        systemWalletAddress: systemWallet.address
      },
      amount,
      transferType: 'international-crypto',
      proofImageUrls: proofs || [],
      status: 'pending'
    }], { session });

    // Deduct amount from user's account
    destinationAccount.balance -= amount;
    await destinationAccount.save({ session });

    // Create transaction record
    await Transaction.create([{
      sender: { user: req.user.id, account: destinationAccountId },
      recipient: {
        ...recipient,
        walletAddress: source.walletAddress,
        systemWalletAddress: systemWallet.address,
        crypto: source.crypto
      },
      amount,
      type: 'crypto-withdrawal',
      status: 'pending',
      reference: transfer[0]._id,
      proofImageUrls: proofs || []
    }], { session });

    // Log the crypto transfer action
    await AuditLog.create([{
      user: req.user.id,
      action: `Crypto transfer initiated: $${amount} in ${source.crypto.toUpperCase()}`,
      description: `User initiated international crypto transfer to ${source.walletAddress.substring(0, 10)}...`,
      ipAddress: req.ip
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: {
        ...transfer[0].toObject(),
        systemWalletAddress: systemWallet.address,
        network: systemWallet.network
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
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