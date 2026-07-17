const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get user wallet
// @route   GET /api/v1/wallet
// @access  Private
exports.getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        user: req.user.id,
        balance: 0,
        currency: 'USD',
        isActive: true
      });
    }

    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'wallet_viewed',
      category: 'account-management',
      description: `User viewed their wallet balance`,
      entity: { type: 'wallet', id: wallet._id }
    });

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet transactions
// @route   GET /api/v1/wallet/transactions
// @access  Private
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const total = await Transaction.countDocuments({ wallet: wallet._id });
    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      data: { transactions, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add funds to wallet
// @route   POST /api/v1/wallet/add-funds
// @access  Private
exports.addFunds = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountId, amount } = req.body;
    
    if (!accountId || !amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid account ID and amount'
      });
    }

    // Get user's account
    const account = await Account.findOne({
      _id: accountId,
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

    if (account.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in account'
      });
    }

    // Get or create wallet
    let wallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!wallet) {
      wallet = await Wallet.create([{
        user: req.user.id,
        balance: 0,
        currency: 'USD',
        isActive: true
      }], { session });
      wallet = wallet[0];
    }

    // Update balances
    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { balance: -amount } },
      { session }
    );

    await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: { balance: amount } },
      { session }
    );

    // Create transaction record
    await Transaction.create([{
      wallet: wallet._id,
      amount,
      type: 'deposit',
      status: 'completed',
      description: `Funds added from ${account.nickname}`
    }], { session });

    await AuditLog.create([{
      user: req.user.id,
      action: 'wallet_funds_added',
      description: `User added $${amount} to their wallet from ${account.nickname}`,
      ipAddress: req.ip
    }], { session });

    await Notification.create([{
      user: req.user.id,
      type: 'wallet_update',
      title: 'Funds Added to Wallet',
      message: `$${amount} has been added to your wallet from ${account.nickname}`,
      relatedModel: 'Wallet',
      relatedId: wallet._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const updatedWallet = await Wallet.findOne({ user: req.user.id });
    res.status(200).json({
      success: true,
      message: 'Funds added to wallet successfully',
      data: updatedWallet
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Withdraw funds from wallet
// @route   POST /api/v1/wallet/withdraw-funds
// @access  Private
exports.withdrawFunds = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountId, amount } = req.body;
    
    if (!accountId || !amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid account ID and amount'
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id }).session(session);
    if (!wallet || wallet.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in wallet'
      });
    }

    // Get destination account
    const account = await Account.findOne({
      _id: accountId,
      user: req.user.id
    }).session(session);

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }

    // Update balances
    await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: { balance: -amount } },
      { session }
    );

    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { balance: amount } },
      { session }
    );

    // Create transaction record
    await Transaction.create([{
      wallet: wallet._id,
      amount,
      type: 'withdrawal',
      status: 'completed',
      description: `Funds withdrawn to ${account.nickname}`
    }], { session });

    await AuditLog.create([{
      user: req.user.id,
      action: 'wallet_funds_withdrawn',
      description: `User withdrew $${amount} from their wallet to ${account.nickname}`,
      ipAddress: req.ip
    }], { session });

    await Notification.create([{
      user: req.user.id,
      type: 'wallet_update',
      title: 'Funds Withdrawn from Wallet',
      message: `$${amount} has been withdrawn from your wallet to ${account.nickname}`,
      relatedModel: 'Wallet',
      relatedId: wallet._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const updatedWallet = await Wallet.findOne({ user: req.user.id });
    res.status(200).json({
      success: true,
      message: 'Funds withdrawn from wallet successfully',
      data: updatedWallet
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all wallets (admin only)
// @route   GET /api/v1/wallet/admin/all
// @access  Private/Admin
exports.getAllWallets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await Wallet.countDocuments();
    const wallets = await Wallet.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: { wallets, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};