const Beneficiary = require('../models/Beneficiary');
const User = require('../models/User');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Helper function to check if account exists internally
const checkInternalAccount = async (accountNumber, routingNumber) => {
  const account = await Account.findOne({ accountNumber, routingNumber });
  if (account) {
    const user = await User.findById(account.user);
    return { exists: true, user, account };
  }
  return { exists: false };
};

// @desc    Get all user beneficiaries
// @route   GET /api/v1/beneficiaries
// @access  Private
exports.getBeneficiaries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = { user: req.user.id };
    if (req.query.isVerified !== undefined) filters.isVerified = req.query.isVerified === 'true';
    if (req.query.isInternal !== undefined) filters.isInternal = req.query.isInternal === 'true';
    if (req.query.isFavorite !== undefined) filters.isFavorite = req.query.isFavorite === 'true';
    
    const total = await Beneficiary.countDocuments(filters);
    const beneficiaries = await Beneficiary.find(filters)
      .sort({ isFavorite: -1, createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('internalUser', 'fullName email')
      .populate('internalAccount', 'accountType nickname');

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'beneficiaries_viewed',
      category: 'account-management',
      description: `User viewed their beneficiaries`,
      metadata: { filters, total }
    });

    res.status(200).json({
      success: true,
      data: { beneficiaries, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single beneficiary
// @route   GET /api/v1/beneficiaries/:id
// @access  Private
exports.getBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('internalUser', 'fullName email')
      .populate('internalAccount', 'accountType nickname');

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'beneficiary_viewed',
      category: 'account-management',
      description: `User viewed beneficiary ${beneficiary.name}`,
      entity: { type: 'user', id: beneficiary._id, name: beneficiary.name }
    });

    res.status(200).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new beneficiary
// @route   POST /api/v1/beneficiaries
// @access  Private
exports.addBeneficiary = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { 
      name, email, phone, nickname, bankName, accountNumber, 
      routingNumber, relationship, isFavorite 
    } = req.body;

    // Validate required fields
    if (!name || !bankName || !accountNumber) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide name, bank name, and account number'
      });
    }

    // Check if this is an internal account
    const internalCheck = await checkInternalAccount(accountNumber, routingNumber);
    
    // Create beneficiary object
    const beneficiaryData = {
      user: req.user.id,
      name,
      email,
      phone,
      nickname,
      bankName,
      accountNumber,
      routingNumber,
      relationship,
      isFavorite: isFavorite || false,
      isInternal: internalCheck.exists
    };

    // If internal, add references
    if (internalCheck.exists) {
      beneficiaryData.internalUser = internalCheck.user._id;
      beneficiaryData.internalAccount = internalCheck.account._id;
      beneficiaryData.isVerified = true; // Auto-verify internal accounts
      beneficiaryData.verificationMethod = 'instant';
    }

    // Create beneficiary
    const beneficiary = await Beneficiary.create([beneficiaryData], { session });

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'beneficiary_added',
      category: 'account-management',
      description: `User added new beneficiary: ${name}`,
      entity: { type: 'user', id: beneficiary[0]._id, name },
      metadata: { isInternal: internalCheck.exists }
    });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'account',
      title: 'Beneficiary Added',
      message: `You've successfully added ${name} as a beneficiary.${internalCheck.exists ? ' This internal account has been automatically verified.' : ' Please verify the account details to enable transfers.'}`,
      relatedModel: 'Beneficiary',
      relatedId: beneficiary[0]._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      data: beneficiary[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A beneficiary with this account number already exists'
      });
    }
    next(error);
  }
};

// @desc    Update beneficiary
// @route   PUT /api/v1/beneficiaries/:id
// @access  Private
exports.updateBeneficiary = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { nickname, relationship, isFavorite } = req.body;
    
    // Find beneficiary and ensure it belongs to user
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!beneficiary) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    // Update only allowed fields
    const beforeUpdate = { ...beneficiary.toObject() };
    if (nickname !== undefined) beneficiary.nickname = nickname;
    if (relationship !== undefined) beneficiary.relationship = relationship;
    if (isFavorite !== undefined) beneficiary.isFavorite = isFavorite;

    await beneficiary.save({ session });

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'beneficiary_updated',
      category: 'account-management',
      description: `User updated beneficiary ${beneficiary.name}`,
      entity: { type: 'user', id: beneficiary._id, name: beneficiary.name },
      before: beforeUpdate,
      after: beneficiary.toObject()
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Beneficiary updated successfully',
      data: beneficiary
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete beneficiary
// @route   DELETE /api/v1/beneficiaries/:id
// @access  Private
exports.deleteBeneficiary = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const beneficiary = await Beneficiary.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!beneficiary) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'beneficiary_deleted',
      category: 'account-management',
      description: `User deleted beneficiary ${beneficiary.name}`,
      entity: { type: 'user', id: beneficiary._id, name: beneficiary.name }
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Beneficiary deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Verify beneficiary
// @route   POST /api/v1/beneficiaries/:id/verify
// @access  Private
exports.verifyBeneficiary = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { verificationMethod, microDepositAmount1, microDepositAmount2 } = req.body;
    
    // Find beneficiary and ensure it belongs to user
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      user: req.user.id,
      isVerified: false
    }).session(session);

    if (!beneficiary) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Unverified beneficiary not found'
      });
    }

    // Handle different verification methods
    if (verificationMethod === 'micro-deposit') {
      // In a real implementation, we would check if the micro-deposits match what was sent
      // For this implementation, we'll simulate successful verification
      if (!microDepositAmount1 || !microDepositAmount2) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Please provide both micro-deposit amounts for verification'
        });
      }
      // Simulate verification success
      beneficiary.isVerified = true;
      beneficiary.verificationMethod = 'micro-deposit';
    } else if (verificationMethod === 'manual') {
      // Manual verification (admin would typically handle this, but user can initiate)
      beneficiary.verificationMethod = 'manual';
      // In real app, this would create a ticket for admin review
      // For this implementation, we'll mark as verified
      beneficiary.isVerified = true;
    }

    await beneficiary.save({ session });

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'beneficiary_verified',
      category: 'account-management',
      description: `User verified beneficiary ${beneficiary.name} using ${verificationMethod}`,
      entity: { type: 'user', id: beneficiary._id, name: beneficiary.name },
      before: { isVerified: false },
      after: { isVerified: true, verificationMethod }
    });

    await Notification.create([{
      user: req.user.id,
      type: 'account',
      title: 'Beneficiary Verified',
      message: `${beneficiary.name} has been successfully verified. You can now send transfers to this beneficiary.`,
      relatedModel: 'Beneficiary',
      relatedId: beneficiary._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Beneficiary verified successfully',
      data: beneficiary
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all beneficiaries (admin only)
// @route   GET /api/v1/beneficiaries/admin/all
// @access  Private/Admin
exports.getAllBeneficiaries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.isVerified !== undefined) filters.isVerified = req.query.isVerified === 'true';
    if (req.query.isInternal !== undefined) filters.isInternal = req.query.isInternal === 'true';
    if (req.query.userId) filters.user = req.query.userId;
    
    const total = await Beneficiary.countDocuments(filters);
    const beneficiaries = await Beneficiary.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'fullName email')
      .populate('internalUser', 'fullName email');

    await AuditLog.log({
      actor: { user: req.user.id, role: 'admin', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'all_beneficiaries_viewed',
      category: 'account-management',
      description: `Admin viewed all platform beneficiaries`,
      metadata: { filters, total }
    });

    res.status(200).json({
      success: true,
      data: { beneficiaries, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};