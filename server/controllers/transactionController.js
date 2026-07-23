const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Wallet = require('../models/Wallet');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

// @desc    Get all user transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    
    // Get user's account IDs to filter transactions
    const userAccounts = await Account.find({ user: req.user.id }).select('_id');
    const userAccountIds = userAccounts.map(account => account._id.toString());
    
    const userWallets = [];
    try {
      const Wallet = require('../models/Wallet');
      const wallets = await Wallet.find({ user: req.user.id }).select('_id');
      userWallets.push(...wallets.map(w => w._id.toString()));
    } catch (e) {
      // Wallet model may not exist
    }

    filters.$or = [
      { user: req.user.id },
      { 'sender.user': req.user.id },
      { 'recipient.user': req.user.id }
    ];
    if (userAccountIds.length > 0) {
      filters.$or.push({ account: { $in: userAccountIds } });
    }
    if (userWallets.length > 0) {
      filters.$or.push({ wallet: { $in: userWallets } });
    }

    const total = await Transaction.countDocuments(filters);
    const transactions = await Transaction.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('sourceAccount', 'accountType nickname')
      .populate('destinationAccount', 'accountType nickname')
      .populate('wallet');

    try {
      await AuditLog.log({
        actor: {
          user: req.user.id,
          role: req.user.role,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        action: 'transactions_viewed',
        category: 'transaction-management',
        description: `User viewed their transaction history`,
        entity: { type: 'user', id: req.user.id }
      });
    } catch (auditErr) {
      logger.warn(`Audit log failed for transactions view: ${auditErr.message}`);
    }

    res.status(200).json({
      success: true,
      data: { transactions, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('sourceAccount', 'accountType nickname')
      .populate('destinationAccount', 'accountType nickname');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify user has access to this transaction
    const userAccounts = await Account.find({ user: req.user.id }).select('_id');
    const userAccountIds = userAccounts.map(account => account._id.toString());
    const sourceIsUser = transaction.sourceAccount && userAccountIds.includes(transaction.sourceAccount._id.toString());
    const destIsUser = transaction.destinationAccount && userAccountIds.includes(transaction.destinationAccount._id.toString());
    const walletIsUser = transaction.wallet && transaction.wallet.toString() === req.user.wallet?._id.toString();
    
    if (!sourceIsUser && !destIsUser && !walletIsUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transaction'
      });
    }

    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'transaction_viewed',
      category: 'transaction-management',
      description: `User viewed transaction ${req.params.id}`,
      entity: { type: 'transaction', id: req.params.id }
    });

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create deposit transaction
// @route   POST /api/v1/transactions/deposit
// @access  Private
exports.deposit = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountId, amount, description, paymentMethod } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid deposit amount'
      });
    }

    // Find account
    const account = await Account.findOne({
      _id: accountId,
      user: req.user.id,
      isActive: true
    });

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found or unavailable'
      });
    }

    // Check if user is frozen
    if (req.user?.isFrozen) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Your account is frozen. Please contact live support for assistance.',
        code: 'ACCOUNT_FROZEN'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user.id,
      type: 'deposit',
      amount,
      currency: 'USD',
      status: 'completed',
      description: description || `Deposit to ${account.nickname}`,
      sourceAccount: null,
      destinationAccount: accountId,
      paymentMethod,
      completedAt: Date.now()
    }], { session });

    // Update account balance
    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { balance: amount } }
    );

    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'deposit_completed',
      category: 'transaction-management',
      description: `User deposited $${amount} to ${account.nickname}`,
      entity: { type: 'transaction', id: transaction[0]._id }
    }], { session });

    await Notification.create([{
      user: req.user.id,
      type: 'transaction',
      title: 'Deposit Successful',
      message: `$${amount.toFixed(2)} has been deposited into your ${account.nickname}. New balance: $${(account.balance + amount).toFixed(2)}`,
      relatedModel: 'Transaction',
      relatedId: transaction[0]._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Send deposit confirmation email
    try {
      await emailService.sendTransactionAlert(req.user, {
        amount: amount,
        type: 'deposit',
        status: 'completed',
        transactionId: transaction[0]._id,
        description: description || `Deposit to ${account.nickname}`,
        direction: 'credit',
        paymentMethod: req.body.paymentMethod
      });
      logger.info(`Deposit confirmation email sent to: ${req.user.email}`);
    } catch (emailErr) {
      logger.error(`Failed to send deposit confirmation email: ${emailErr.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Deposit completed successfully',
      data: transaction[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Create crypto deposit transaction
// @route   POST /api/v1/transactions/crypto-deposit
// @access  Private
exports.cryptoDeposit = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, destinationAccountId, source, amount, email, investmentDetails } = req.body;
    
    // Validate required fields
    if (!destinationAccountId || !amount || amount <= 0 || !source.crypto) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: destinationAccountId, valid amount, and crypto source details'
      });
    }

    // Find account
    const account = await Account.findOne({
      _id: destinationAccountId,
      user: req.user.id,
      isActive: true
    });

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Destination account not found or unavailable'
      });
    }

    // Create transaction record with crypto-specific metadata
    const transaction = await Transaction.create([{
      user: req.user.id,
      account: account._id,
      type: 'deposit',
      amount: amount,
      currency: 'USD',
      status: 'pending',
      description: `Crypto deposit - ${source.crypto.toUpperCase()}`,
      category: 'deposit',
      direction: 'credit',
      metadata: {
        crypto: source.crypto,
        transactionHash: source.transactionHash,
        network: source.network,
        proofImages: source.proofImages || [],
        investmentDetails: investmentDetails || null
      },
      sourceAccount: null,
      destinationAccount: account._id
    }], { session });

    // Update account balance
    account.balance += amount;
    await account.save({ session });

    // Create audit log
    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'crypto_deposit_initiated',
      category: 'transaction-management',
      description: `User initiated ${source.crypto.toUpperCase()} deposit of $${amount} to account ${account.accountNumber}`,
      entity: { type: 'transaction', id: transaction[0]._id },
      metadata: { crypto: source.crypto, amount, network: source.network }
    }, { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'deposit',
      title: 'Crypto Deposit Initiated',
      message: `Your ${source.crypto.toUpperCase()} deposit of $${amount} is being processed. Transaction ID: ${transaction[0]._id}`,
      priority: 'medium',
      relatedEntity: {
        type: 'transaction',
        id: transaction[0]._id
      }
    }], { session });

    // Send confirmation email
    try {
      await emailService.sendCryptoDepositConfirmationEmail(req.user, {
        amount,
        crypto: source.crypto,
        network: source.network,
        transactionId: transaction[0]._id,
        transactionHash: source.transactionHash,
        destinationAccount: account.accountNumber,
        investmentDetails: investmentDetails
      }, email || req.user.email);
      logger.info(`Crypto deposit confirmation email sent to ${email || req.user.email} for transaction ${transaction[0]._id}`);
    } catch (emailErr) {
      logger.error(`Failed to send crypto deposit email: ${emailErr.message}`);
      // Don't fail the transaction if email fails
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: transaction[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Create withdrawal transaction
// @route   POST /api/v1/transactions/withdraw
// @access  Private
exports.withdraw = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountId, amount, description } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid withdrawal amount'
      });
    }

    // Find account
    const account = await Account.findOne({
      _id: accountId,
      user: req.user.id,
      isActive: true
    });

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found or unavailable'
      });
    }

    // Check sufficient funds
    if (account.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds to complete withdrawal'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user.id,
      type: 'withdrawal',
      amount,
      currency: 'USD',
      status: 'completed',
      description: description || `Withdrawal from ${account.nickname}`,
      sourceAccount: accountId,
      destinationAccount: null,
      completedAt: Date.now()
    }], { session });

    // Update account balance
    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { balance: -amount } }
    );

    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'withdrawal_completed',
      category: 'transaction-management',
      description: `User withdrew $${amount} from ${account.nickname}`,
      entity: { type: 'transaction', id: transaction._id }
    }], { session });

    await Notification.create([{
      user: req.user.id,
      type: 'transaction',
      title: 'Withdrawal Successful',
      message: `$${amount.toFixed(2)} has been withdrawn from your ${account.nickname}. New balance: $${(account.balance - amount).toFixed(2)}`,
      relatedModel: 'Transaction',
      relatedId: transaction[0]._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Send withdrawal confirmation email
    try {
      await emailService.sendTransactionAlert(req.user, {
        amount: amount,
        type: 'withdrawal',
        status: 'completed',
        transactionId: transaction[0]._id,
        description: description || `Withdrawal from ${account.nickname}`,
        direction: 'debit'
      });
      logger.info(`Withdrawal confirmation email sent to: ${req.user.email}`);
    } catch (emailErr) {
      logger.error(`Failed to send withdrawal confirmation email: ${emailErr.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: transaction[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Admin: Get all transactions (for admin panel)
// @desc    Get all transactions across platform (admin only)
// @route   GET /api/v1/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.user) filters.user = req.query.user;

    const total = await Transaction.countDocuments(filters);
    const transactions = await Transaction.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'firstName lastName email')
      .populate('sourceAccount', 'accountType nickname')
      .populate('destinationAccount', 'accountType nickname');

    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'admin_transactions_viewed',
      category: 'transaction-management',
      description: `Admin viewed all platform transactions`,
      entity: { type: 'transaction', id: null }
    });

    res.status(200).json({
      success: true,
      data: { transactions, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get transaction statistics
// @desc    Get transaction statistics across platform (admin only)
// @route   GET /api/v1/admin/transactions/stats
// @access  Private/Admin
exports.getTransactionStats = async (req, res, next) => {
  try {
    // Get total transactions count
    const totalTransactions = await Transaction.countDocuments();
    
    // Get transactions by status
    const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    const failedTransactions = await Transaction.countDocuments({ status: 'failed' });
    
    // Get transactions by type
    const deposits = await Transaction.countDocuments({ type: 'deposit' });
    const withdrawals = await Transaction.countDocuments({ type: 'withdrawal' });
    const transfers = await Transaction.countDocuments({ type: 'transfer' });
    const cryptoTransactions = await Transaction.countDocuments({ type: 'crypto' });
    
    // Calculate total volume
    let totalVolume = 0;
    let monthlyVolume = 0;
    
    try {
      const transactionStats = await Transaction.aggregate([
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
      
      if (transactionStats.length > 0) {
        totalVolume = transactionStats[0].totalVolume || 0;
        monthlyVolume = transactionStats[0].monthlyVolume || 0;
      }
    } catch (aggError) {
      logger.warn('Transaction stats aggregation warning:', aggError.message);
    }
    
    const stats = {
      total: totalTransactions,
      completed: completedTransactions,
      pending: pendingTransactions,
      failed: failedTransactions,
      byType: {
        deposits,
        withdrawals,
        transfers,
        crypto: cryptoTransactions
      },
      volume: {
        total: totalVolume,
        monthly: monthlyVolume
      }
    };

    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'admin_transaction_stats_viewed',
      category: 'transaction-management',
      description: `Admin viewed transaction statistics`,
      entity: { type: 'transaction', id: null }
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Approve pending transaction
// @desc    Approve a pending transaction (admin only)
// @route   PUT /api/v1/admin/transactions/:id/approve
// @access  Private/Admin
exports.approveTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be approved'
      });
    }

    // Update transaction status
    await Transaction.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        completedAt: Date.now(),
        processedBy: req.user.id
      }
    );

    // If this is a transfer, update account balances
    if (transaction.type === 'transfer' && transaction.sourceAccount && transaction.destinationAccount) {
      await Account.findByIdAndUpdate(
        transaction.sourceAccount,
        { $inc: { balance: -transaction.amount } }
      );
      await Account.findByIdAndUpdate(
        transaction.destinationAccount,
        { $inc: { balance: transaction.amount } }
      );
    }

    // If it's a deposit, add to destination account
    if (transaction.type === 'deposit' && transaction.destinationAccount) {
      await Account.findByIdAndUpdate(
        transaction.destinationAccount,
        { $inc: { balance: transaction.amount } }
      );
    }

    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'transaction_approved',
      category: 'transaction-management',
      description: `Admin approved transaction ${req.params.id}`,
      entity: { type: 'transaction', id: req.params.id }
    }], { session });

    await Notification.create([{
      user: transaction.user,
      type: 'transaction',
      title: 'Transaction Approved',
      message: `Your ${transaction.type} transaction of $${transaction.amount.toFixed(2)} has been approved and completed.`,
      relatedModel: 'Transaction',
      relatedId: transaction._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Transaction approved and completed successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Admin: Reject pending transaction
// @desc    Reject a pending transaction (admin only)
// @route   PUT /api/v1/admin/transactions/:id/reject
// @access  Private/Admin
exports.rejectTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be rejected'
      });
    }

    // Update transaction status
    await Transaction.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'failed',
        failureReason: reason || 'Rejected by administrator',
        processedBy: req.user.id
      }
    );

    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'transaction_rejected',
      category: 'transaction-management',
      description: `Admin rejected transaction ${req.params.id}. Reason: ${reason}`,
      entity: { type: 'transaction', id: req.params.id }
    }], { session });

    await Notification.create([{
      user: transaction.user,
      type: 'transaction',
      title: 'Transaction Rejected',
      message: `Your ${transaction.type} transaction of $${transaction.amount.toFixed(2)} has been rejected. Reason: ${reason}`,
      relatedModel: 'Transaction',
      relatedId: transaction._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Transaction rejected successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};