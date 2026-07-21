const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Account = require('../models/Account');
const Transfer = require('../models/Transfer');
const SupportTicket = require('../models/SupportTicket');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { UserLoan, LoanProduct } = require('../models/Loan');
const { UserInvestment } = require('../models/Investment');
const KYC = require('../models/KYC');
const Card = require('../models/Card');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get real counts from the database
    const totalUsers = await User.countDocuments();
    const totalAccounts = await Account.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
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

    const [accounts, loans, transactions, transfers, investments, kycs, cards] = await Promise.all([
      Account.find({ user: req.params.id }),
      UserLoan.find({ user: req.params.id }).populate('loanProduct', 'name interestRate'),
      Transaction.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(100),
      Transfer.find({ initiatedBy: req.params.id }).populate('sourceAccount', 'accountNumber accountType').sort({ createdAt: -1 }).limit(100),
      UserInvestment.find({ user: req.params.id }).populate('plan', 'name type expectedReturn').sort({ createdAt: -1 }).limit(100),
      KYC.find({ user: req.params.id }).sort({ submittedAt: -1 }),
      Card.find({ user: req.params.id }).populate('account', 'accountNumber accountType').sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        accounts,
        loans,
        transactions,
        transfers,
        investments,
        kycs,
        cards
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
      twoFactorEnabled: req.body.twoFactorEnabled,
      monthlyIncome: req.body.monthlyIncome,
      monthlyExpenses: req.body.monthlyExpenses,
      netSavings: req.body.netSavings
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

// @desc    Create transaction for any user (admin only)
// @route   POST /api/v1/admin/transactions
// @access  Private/Admin
exports.createTransactionForUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, type, amount, description, status, accountId } = req.body;

    if (!userId || !type || !amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, type, and amount'
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let destinationAccount = accountId;
    if (!destinationAccount) {
      const userAccounts = await Account.find({ user: userId }).session(session);
      if (userAccounts.length > 0) {
        destinationAccount = userAccounts[0]._id;
      }
    }

    const transaction = await Transaction.create([{
      user: userId,
      type,
      amount: parseFloat(amount),
      currency: 'USD',
      status: status || 'completed',
      description: description || `Admin ${type} for user`,
      sourceAccount: type === 'withdrawal' ? destinationAccount : null,
      destinationAccount: type === 'deposit' ? destinationAccount : null,
      completedAt: Date.now()
    }], { session });

    if (destinationAccount && type === 'deposit') {
      await Account.findByIdAndUpdate(destinationAccount, { $inc: { balance: parseFloat(amount) } }, { session });
    } else if (destinationAccount && type === 'withdrawal') {
      await Account.findByIdAndUpdate(destinationAccount, { $inc: { balance: -parseFloat(amount) } }, { session });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: `Admin created ${type} transaction`,
      category: 'transaction-management',
      description: `Admin created ${type} transaction of $${amount} for user ${user.email}`,
      entity: { type: 'transaction', id: transaction[0]._id }
    }, { session });

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

// @desc    Create transfer for any user (admin only)
// @route   POST /api/v1/admin/transfers
// @access  Private/Admin
exports.createTransferForUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, amount, transferType, status, recipientDetails, sourceAccountId } = req.body;

    if (!userId || !amount || !transferType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, amount, and transferType'
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sourceAccount = sourceAccountId
      ? await Account.findOne({ _id: sourceAccountId, user: userId }).session(session)
      : await Account.findOne({ user: userId }).session(session);

    if (!sourceAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'No account found for user'
      });
    }

    if (sourceAccount.balance < parseFloat(amount)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance in source account'
      });
    }

    const transfer = await Transfer.create([{
      initiatedBy: userId,
      sourceAccount: sourceAccount._id,
      recipientDetails: recipientDetails || {},
      amount: parseFloat(amount),
      transferType,
      status: status || 'completed',
      proofImageUrl: null
    }], { session });

    sourceAccount.balance -= parseFloat(amount);
    await sourceAccount.save({ session });

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: `Admin created ${transferType} transfer`,
      category: 'transaction-management',
      description: `Admin created ${transferType} transfer of $${amount} for user ${user.email}`,
      entity: { type: 'transfer', id: transfer[0]._id }
    }, { session });

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

// @desc    Create investment for any user (admin only)
// @route   POST /api/v1/admin/investments
// @access  Private/Admin
exports.createInvestmentForUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, amount, plan, status } = req.body;

    if (!userId || !amount || !plan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, amount, and plan details'
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const account = await Account.findOne({ user: userId }).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'No account found for user'
      });
    }

    if (account.balance < parseFloat(amount)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance in user account'
      });
    }

    const investment = await UserInvestment.create([{
      user: userId,
      plan: plan.name || 'Custom Plan',
      planType: plan.type || 'stocks',
      amountInvested: parseFloat(amount),
      expectedReturn: plan.expectedReturn || 5,
      status: status || 'active',
      purchaseDate: Date.now()
    }], { session });

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: `Admin created investment`,
      category: 'investment-management',
      description: `Admin created investment of $${amount} for user ${user.email}`,
      entity: { type: 'investment', id: investment[0]._id }
    }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: investment[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Admin update KYC status
// @route   PUT /api/v1/admin/kyc/:id
// @access  Private/Admin
exports.updateKYC = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, rejectionReason, notes, level } = req.body;
    const kyc = await KYC.findById(req.params.id).session(session);
    if (!kyc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'KYC not found' });
    }

    const before = { status: kyc.status };
    kyc.status = status || kyc.status;
    if (rejectionReason) kyc.rejectionReason = rejectionReason;
    if (notes) kyc.verificationDetails.notes = notes;
    if (level) kyc.level = level;
    kyc.history.push({
      status: kyc.status,
      comment: notes || rejectionReason || 'KYC status updated by admin',
      changedBy: req.user.id,
      changedAt: new Date()
    });
    await kyc.save({ session });

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: `Admin updated KYC to ${status}`,
      category: 'kyc-management',
      description: `Admin updated KYC ${kyc.kycId} to ${status}`,
      entity: { type: 'kyc', id: kyc._id },
      before,
      after: { status: kyc.status }
    }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: kyc });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Admin update card
// @route   PUT /api/v1/admin/cards/:id
// @access  Private/Admin
exports.updateCard = async (req, res, next) => {
  try {
    const { nickName, dailySpendingLimit, creditLimit, currentBalance, isActive, isLocked, isVirtual, lockReason, notificationsEnabled, internationalTransactionsEnabled, onlineTransactionsEnabled, contactlessEnabled, cardholderName, cardType, cardNetwork, billingAddress } = req.body;
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const updateFields = {};
    if (nickName !== undefined) updateFields.nickName = nickName;
    if (dailySpendingLimit !== undefined) updateFields.dailySpendingLimit = dailySpendingLimit;
    if (creditLimit !== undefined) updateFields.creditLimit = creditLimit;
    if (currentBalance !== undefined) updateFields.currentBalance = currentBalance;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (isLocked !== undefined) updateFields.isLocked = isLocked;
    if (isVirtual !== undefined) updateFields.isVirtual = isVirtual;
    if (lockReason !== undefined) updateFields.lockReason = lockReason;
    if (notificationsEnabled !== undefined) updateFields.notificationsEnabled = notificationsEnabled;
    if (internationalTransactionsEnabled !== undefined) updateFields.internationalTransactionsEnabled = internationalTransactionsEnabled;
    if (onlineTransactionsEnabled !== undefined) updateFields.onlineTransactionsEnabled = onlineTransactionsEnabled;
    if (contactlessEnabled !== undefined) updateFields.contactlessEnabled = contactlessEnabled;
    if (cardholderName !== undefined) updateFields.cardholderName = cardholderName;
    if (cardType !== undefined) updateFields.cardType = cardType;
    if (cardNetwork !== undefined) updateFields.cardNetwork = cardNetwork;
    if (billingAddress) updateFields.billingAddress = { ...(card.billingAddress || {}), ...billingAddress };

    const updatedCard = await Card.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('account', 'accountNumber accountType balance');

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'Admin updated card',
      category: 'card-management',
      description: `Admin updated card ending in ${updatedCard.lastFourDigits}`,
      entity: { type: 'card', id: updatedCard._id }
    });

    res.status(200).json({ success: true, data: updatedCard });
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