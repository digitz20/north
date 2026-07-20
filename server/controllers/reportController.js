const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Investment = require('../models/Investment');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get transaction report (admin only)
// @route   GET /api/v1/admin/reports/transactions
// @access  Private/Admin
exports.getTransactionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          credits: {
            $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
          },
          debits: {
            $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const byStatus = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byCategory = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: transactions[0] || { total: 0, totalAmount: 0, avgAmount: 0, credits: 0, debits: 0 },
        byStatus,
        byCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users report (admin only)
// @route   GET /api/v1/admin/reports/users
// @access  Private/Admin
exports.getUsersReport = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const frozenUsers = await User.countDocuments({ isFrozen: true });
    
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        frozenUsers,
        newUsersThisMonth,
        byRole
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get accounts report (admin only)
// @route   GET /api/v1/admin/reports/accounts
// @access  Private/Admin
exports.getAccountsReport = async (req, res, next) => {
  try {
    const totalAccounts = await Account.countDocuments();
    const activeAccounts = await Account.countDocuments({ isActive: true });
    
    const totalBalance = await Account.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    const byType = await Account.aggregate([
      { $group: { _id: '$accountType', count: { $sum: 1 }, totalBalance: { $sum: '$balance' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAccounts,
        activeAccounts,
        totalBalance: totalBalance[0]?.total || 0,
        byType
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loans report (admin only)
// @route   GET /api/v1/admin/reports/loans
// @access  Private/Admin
exports.getLoansReport = async (req, res, next) => {
  try {
    const totalLoans = await Loan.countDocuments();
    
    const byStatus = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$loanAmount' } } }
    ]);

    const byType = await Loan.aggregate([
      { $group: { _id: '$loanType', count: { $sum: 1 }, totalAmount: { $sum: '$loanAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLoans,
        byStatus,
        byType
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get investments report (admin only)
// @route   GET /api/v1/admin/reports/investments
// @access  Private/Admin
exports.getInvestmentsReport = async (req, res, next) => {
  try {
    const totalInvestments = await Investment.countDocuments();
    
    const summary = await Investment.aggregate([
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$investedAmount' },
          totalCurrentValue: { $sum: '$currentValue' },
          totalReturns: { $sum: { $subtract: ['$currentValue', '$investedAmount'] } }
        }
      }
    ]);

    const byType = await Investment.aggregate([
      { $group: { _id: '$investmentType', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInvestments,
        summary: summary[0] || { totalInvested: 0, totalCurrentValue: 0, totalReturns: 0 },
        byType
      }
    });
  } catch (error) {
    next(error);
  }
};
