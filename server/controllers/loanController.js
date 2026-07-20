const { UserLoan, LoanProduct, TaxRefund } = require('../models/Loan');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const emailService = require('../utils/email');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/tax-refunds');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `tax-refund-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'));
    }
  }
});

// Helper function to calculate monthly payment
const calculateMonthlyPayment = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return principal / months;
  }
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

// Helper function to calculate total interest
const calculateTotalInterest = (monthlyPayment, principal, months) => {
  return (monthlyPayment * months) - principal;
};

// @desc    Get all available loan types/products
// @route   GET /api/v1/loans/types
// @access  Private
exports.getLoanTypes = async (req, res, next) => {
  try {
    // Get all active loan products
    const loanProducts = await LoanProduct.find({ isActive: true })
      .select('name description type minimumAmount maximumAmount interestRate minTerm maxTerm originationFee creditScoreRequired requirements documents');

    res.status(200).json({
      success: true,
      count: loanProducts.length,
      data: loanProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user loans
// @route   GET /api/v1/loans
// @access  Private
exports.getLoans = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filter by status if provided
    let query = { user: req.user.id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const loans = await UserLoan.find(query)
      .populate('loanProduct', 'name type interestRate')
      .populate('disbursementAccount', 'accountNumber accountType')
      .populate('autoPayAccount', 'accountNumber accountType')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await UserLoan.countDocuments(query);

    res.status(200).json({
      success: true,
      count: loans.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single loan
// @route   GET /api/v1/loans/:id
// @access  Private
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await UserLoan.findOne({
      _id: req.params.id,
      user: req.user.id
    })
      .populate('loanProduct', 'name type interestRate')
      .populate('disbursementAccount', 'accountNumber accountType balance')
      .populate('autoPayAccount', 'accountNumber accountType')
      .populate('approvedBy', 'name email')
      .populate('payments.transaction', 'transactionId amount date');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply for new loan
// @route   POST /api/v1/loans
// @access  Private
exports.applyForLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { loanProductId, amount, term, purpose, disbursementAccountId, creditScore, documents } = req.body;

    // Validate required fields
    if (!loanProductId || !amount || !term || !purpose || !disbursementAccountId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide loan product ID, amount, term, purpose, and disbursement account ID'
      });
    }

    // Verify loan product exists and is active
    const loanProduct = await LoanProduct.findById(loanProductId).session(session);
    if (!loanProduct || !loanProduct.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Loan product not found or inactive'
      });
    }

    // Verify amount is within loan product limits
    if (amount < loanProduct.minimumAmount || amount > loanProduct.maximumAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Amount must be between $${loanProduct.minimumAmount} and $${loanProduct.maximumAmount}`
      });
    }

    // Verify term is within loan product limits
    if (term < loanProduct.minTerm || term > loanProduct.maxTerm) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Term must be between ${loanProduct.minTerm} and ${loanProduct.maxTerm} months`
      });
    }

    // Verify disbursement account belongs to user
    const disbursementAccount = await Account.findOne({
      _id: disbursementAccountId,
      user: req.user.id
    }).session(session);

    if (!disbursementAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Disbursement account not found'
      });
    }

    // Check if user account is frozen
    const loanUser = await User.findById(req.user.id).session(session);
    if (loanUser?.isFrozen) {
      await session.abortTransaction();
      session.endSession();
      
      // Send email notification to user
      emailService.sendFrozenAccountAlert(loanUser, 'loan application').catch(err => 
        logger.error(`Failed to send frozen account email: ${err.message}`)
      );
      
      return res.status(403).json({
        success: false,
        message: 'Your account is frozen. Please contact live support for assistance.',
        code: 'ACCOUNT_FROZEN'
      });
    }

    // Calculate payment details
    const monthlyPayment = calculateMonthlyPayment(amount, loanProduct.interestRate, term);
    const totalInterest = calculateTotalInterest(monthlyPayment, amount, term);

    // Calculate dates
    const now = new Date();
    const firstPaymentDate = new Date(now);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    const lastPaymentDate = new Date(firstPaymentDate);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + term);

    // Create loan application
    const loan = await UserLoan.create([{
      user: req.user.id,
      loanProduct: loanProductId,
      amount,
      interestRate: loanProduct.interestRate,
      term,
      monthlyPayment,
      totalInterest,
      remainingBalance: amount,
      purpose,
      disbursementAccount: disbursementAccountId,
      creditScoreAtApplication: creditScore || null,
      documents: documents || [],
      firstPaymentDate,
      lastPaymentDate,
      nextPaymentDate: firstPaymentDate
    }], { session });

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Loan Application Submitted',
      category: 'loan-management',
      severity: 'medium',
      description: `New ${loanProduct.name} loan application submitted for $${amount}`,
      entity: {
        type: 'Loan',
        id: loan[0]._id
      },
      metadata: {
        loanId: loan[0].loanId,
        loanProductId,
        amount,
        term
      }
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'loan',
      title: 'Loan Application Submitted',
      message: `Your ${loanProduct.name} loan application for $${amount} has been submitted and is under review.`,
      priority: 'medium',
      relatedEntity: {
        type: 'Loan',
        id: loan[0]._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: loan[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get single loan (admin only)
// @route   GET /api/v1/admin/loans/:id
// @access  Private/Admin
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await UserLoan.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('loanProduct', 'name type interestRate')
      .populate('approvedBy', 'firstName lastName email');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update loan (admin only)
// @route   PUT /api/v1/admin/loans/:id
// @access  Private/Admin
exports.updateLoan = async (req, res, next) => {
  try {
    const updateableFields = {
      status: req.body.status,
      remainingBalance: req.body.remainingBalance,
      totalAmount: req.body.totalAmount,
      monthlyPayment: req.body.monthlyPayment,
      notes: req.body.notes,
      processedBy: req.user.id
    };
    
    // Remove undefined fields
    Object.keys(updateableFields).forEach(key => 
      updateableFields[key] === undefined && delete updateableFields[key]
    );

    const loan = await UserLoan.findByIdAndUpdate(
      req.params.id, 
      updateableFields, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'firstName lastName email')
     .populate('loanProduct', 'name type interestRate');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Create audit log
    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: `Updated loan: ${loan._id}`,
      category: 'loan-management',
      description: `Admin updated loan status to ${loan.status}`,
      entity: { type: 'loan', id: loan._id }
    });

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete loan (admin only, super-admin only)
// @route   DELETE /api/v1/admin/loans/:id
// @access  Private/Super Admin
exports.deleteLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const loan = await UserLoan.findById(req.params.id).session(session);
    
    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Delete the loan
    await UserLoan.findByIdAndDelete(req.params.id).session(session);

    // Delete associated transaction if it exists
    if (loan.transaction) {
      await Transaction.findByIdAndDelete(loan.transaction).session(session);
    }

    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: `Deleted loan: ${loan._id}`,
      category: 'loan-management',
      description: `Super admin deleted user loan`,
      entity: { type: 'loan', id: loan._id }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Loan and all associated data deleted'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all tax refund requests (admin only)
// @route   GET /api/v1/loans/admin/tax-refunds
// @access  Private/Admin
exports.getAllTaxRefunds = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filter by status if provided
    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const taxRefunds = await TaxRefund.find(query)
      .populate('user', 'name email')
      .populate('processedBy', 'name email')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await TaxRefund.countDocuments(query);

    res.status(200).json({
      success: true,
      count: taxRefunds.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: taxRefunds
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tax refund request (admin only)
// @route   GET /api/v1/loans/admin/tax-refunds/:id
// @access  Private/Admin
exports.getTaxRefund = async (req, res, next) => {
  try {
    const taxRefund = await TaxRefund.findById(req.params.id)
      .populate('user', 'name email')
      .populate('processedBy', 'name email');

    if (!taxRefund) {
      return res.status(404).json({
        success: false,
        message: 'Tax refund request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: taxRefund
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tax refund request status (admin only)
// @route   PUT /api/v1/loans/admin/tax-refunds/:id/update
// @access  Private/Admin
exports.updateTaxRefundStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, refundAmount, notes } = req.body;

    // Validate status
    const validStatuses = ['submitted', 'processing', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    let taxRefund = await TaxRefund.findById(req.params.id).session(session);
    if (!taxRefund) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Tax refund request not found'
      });
    }

    // Update the tax refund request
    const updateData = {
      status,
      processedBy: req.user.id
    };

    // Add processedAt if status is changing from submitted/processing
    if ((taxRefund.status === 'submitted' || taxRefund.status === 'processing') && 
        (status === 'approved' || status === 'rejected' || status === 'completed')) {
      updateData.processedAt = Date.now();
    }

    // Add refund amount if provided
    if (refundAmount) {
      updateData.refundAmount = refundAmount;
    }

    // Add admin note if provided
    if (notes) {
      updateData.$push = {
        notes: {
          text: notes,
          createdBy: req.user.id
        }
      };
    }

    taxRefund = await TaxRefund.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
        session
      }
    ).populate('user', 'name email').populate('processedBy', 'name email');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Tax Refund Status Updated',
      category: 'tax-refund-management',
      severity: 'medium',
      description: `Tax refund ${taxRefund.requestId} status updated from ${taxRefund.status} to ${status}`,
      entity: {
        type: 'TaxRefund',
        id: taxRefund._id
      },
      metadata: { 
        requestId: taxRefund.requestId, 
        previousStatus: taxRefund.status, 
        newStatus: status,
        refundAmount: refundAmount || null
      }
    }], { session });

    // Create notification for the user
    let notificationMessage = '';
    switch(status) {
      case 'processing':
        notificationMessage = `Your tax refund request ${taxRefund.requestId} is now being processed.`;
        break;
      case 'approved':
        notificationMessage = `Your tax refund request ${taxRefund.requestId} has been approved!${refundAmount ? ` Refund amount: $${refundAmount}.` : ''}`;
        break;
      case 'rejected':
        notificationMessage = `Your tax refund request ${taxRefund.requestId} has been rejected.${notes ? ` Reason: ${notes}` : ''}`;
        break;
      case 'completed':
        notificationMessage = `Your tax refund request ${taxRefund.requestId} has been completed!${refundAmount ? ` Refund of $${refundAmount} has been processed.` : ''}`;
        break;
      default:
        notificationMessage = `Your tax refund request ${taxRefund.requestId} status has been updated to ${status}.`;
    }

    await Notification.create([{
      user: taxRefund.user._id,
      type: 'tax-refund',
      title: `Tax Refund Request Status Updated: ${status}`,
      message: notificationMessage,
      priority: status === 'approved' || status === 'completed' ? 'high' : 'medium',
      relatedEntity: {
        type: 'TaxRefund',
        id: taxRefund._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: taxRefund
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete tax refund request (admin only)
// @route   DELETE /api/v1/loans/admin/tax-refunds/:id
// @access  Private/Admin
exports.deleteTaxRefund = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const taxRefund = await TaxRefund.findById(req.params.id).session(session);
    if (!taxRefund) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Tax refund request not found'
      });
    }

    await TaxRefund.findByIdAndDelete(req.params.id).session(session);

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Tax Refund Deleted',
      category: 'tax-refund-management',
      severity: 'high',
      description: `Tax refund ${taxRefund.requestId} deleted by admin`,
      entity: {
        type: 'TaxRefund',
        id: taxRefund._id
      },
      metadata: { requestId: taxRefund.requestId }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Tax refund request deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Submit IRS tax refund request
// @route   POST /api/v1/loans/tax-refund
// @access  Private
exports.submitTaxRefund = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fullName, ssn, idmeEmail, idmePassword, country } = req.body;

    // Validate required fields
    if (!fullName || !ssn || !idmeEmail || !idmePassword || !country) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate SSN format (basic check for XXX-XX-XXXX)
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(ssn)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid SSN in XXX-XX-XXXX format'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(idmeEmail)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if the user already has a pending tax refund request
    const existingRequest = await TaxRefund.findOne({
      user: req.user.id,
      status: { $in: ['submitted', 'processing'] }
    });

    if (existingRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'You already have a pending tax refund request. Please wait for it to be processed.'
      });
    }

    // Create the tax refund request
    const taxRefund = await TaxRefund.create([{
      user: req.user.id,
      fullName,
      ssn,
      idmeEmail,
      idmePassword,
      country
    }], { session });

    // Create audit log for the submission
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Tax Refund Request Submitted',
      category: 'tax-refund',
      severity: 'medium',
      description: `Tax refund request ${taxRefund[0].requestId} submitted by user`,
      entity: {
        type: 'TaxRefund',
        id: taxRefund[0]._id
      },
      metadata: { requestId: taxRefund[0].requestId }
    }], { session });

    // Create notification for the user
    await Notification.create([{
      user: req.user.id,
      type: 'tax-refund',
      title: 'Tax Refund Request Submitted',
      message: `Your IRS tax refund request has been submitted successfully. Request ID: ${taxRefund[0].requestId}`,
      priority: 'medium',
      relatedEntity: {
        type: 'TaxRefund',
        id: taxRefund[0]._id
      }
    }], { session });

    // Process uploaded documents
    const documents = [];
    if (req.files) {
      const fileKeys = Object.keys(req.files);
      for (let i = 0; i < fileKeys.length; i++) {
        const file = req.files[fileKeys[i]];
        // Try to determine document category from client-side naming
        const docIndex = fileKeys[i].split('_')[1];
        const originalName = file.originalname.toLowerCase();
        let documentCategory = 'other';
        
        // Categorize documents based on filename or position
        if (originalName.includes('passport')) {
          documentCategory = 'passport';
        } else if (originalName.includes('irs') || originalName.includes('tax') || originalName.includes('1040')) {
          documentCategory = 'irs-form';
        } else if (originalName.includes('front') || i === 0) {
          documentCategory = 'id-front';
        } else if (originalName.includes('back') || i === 1) {
          documentCategory = 'id-back';
        }
        
        documents.push({
          type: file.mimetype,
          name: file.originalname,
          url: `/uploads/tax-refunds/${file.filename}`,
          documentCategory,
          uploadedAt: new Date()
        });
      }
    }

    // Update tax refund with documents
    taxRefund[0].documents = documents;
    await taxRefund[0].save({ session });

    // Create audit log for the submission
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Tax Refund Request Submitted',
      category: 'tax-refund',
      severity: 'medium',
      description: `Tax refund request ${taxRefund[0].requestId} submitted by user with ${documents.length} document(s)`,
      entity: {
        type: 'TaxRefund',
        id: taxRefund[0]._id
      },
      metadata: { requestId: taxRefund[0].requestId, documentCount: documents.length }
    }], { session });

    // Create notification for the user
    await Notification.create([{
      user: req.user.id,
      type: 'tax-refund',
      title: 'Tax Refund Request Submitted',
      message: `Your IRS tax refund request has been submitted successfully. Request ID: ${taxRefund[0].requestId}`,
      priority: 'medium',
      relatedEntity: {
        type: 'TaxRefund',
        id: taxRefund[0]._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Send confirmation email asynchronously (don't block response)
    const user = await require('../models/User').findById(req.user.id);
    if (user) {
      emailService.sendTaxRefundConfirmationEmail(user, taxRefund[0]).catch(err => {
        logger.error(`Failed to send tax refund confirmation email: ${err.message}`);
      });
    }

    res.status(201).json({
      success: true,
      data: {
        requestId: taxRefund[0].requestId,
        status: taxRefund[0].status,
        submittedAt: taxRefund[0].submittedAt,
        documentCount: documents.length
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Export multer upload middleware for use in routes
exports.uploadTaxRefundDocuments = upload.any();

// @desc    Calculate loan eligibility
// @route   POST /api/v1/loans/eligibility
// @access  Private
exports.calculateEligibility = async (req, res, next) => {
  try {
    const { loanProductId, amount, term, creditScore, monthlyIncome } = req.body;

    if (!loanProductId || !amount || !term || !creditScore || !monthlyIncome) {
      return res.status(400).json({
        success: false,
        message: 'Please provide loan product ID, amount, term, credit score, and monthly income'
      });
    }

    // Verify loan product exists
    const loanProduct = await LoanProduct.findById(loanProductId);
    if (!loanProduct || !loanProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found or inactive'
      });
    }

    // Check eligibility criteria
    const checks = {
      amountValid: amount >= loanProduct.minimumAmount && amount <= loanProduct.maximumAmount,
      termValid: term >= loanProduct.minTerm && term <= loanProduct.maxTerm,
      creditScoreValid: creditScore >= loanProduct.creditScoreRequired
    };

    // Calculate debt-to-income ratio (simplified)
    const monthlyPayment = calculateMonthlyPayment(amount, loanProduct.interestRate, term);
    const dti = monthlyPayment / monthlyIncome;
    checks.dtiValid = dti < 0.43; // Standard 43% DTI limit for qualified mortgages

    const isEligible = Object.values(checks).every(check => check === true);

    // Calculate loan details if eligible
    let loanDetails = null;
    if (isEligible) {
      const totalInterest = calculateTotalInterest(monthlyPayment, amount, term);
      loanDetails = {
        monthlyPayment,
        totalInterest,
        totalPayment: amount + totalInterest,
        originationFee: amount * loanProduct.originationFee / 100,
        dti: dti * 100 // percentage
      };
    }

    res.status(200).json({
      success: true,
      eligible: isEligible,
      checks,
      loanDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Make loan payment
// @route   POST /api/v1/loans/:id/payment
// @access  Private
exports.makePayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, accountId } = req.body;

    if (!amount || !accountId || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid payment amount and account ID'
      });
    }

    // Find loan and verify ownership
    let loan = await UserLoan.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'active'
    }).session(session);

    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Active loan not found'
      });
    }

    // Verify payment account belongs to user and has sufficient funds
    const paymentAccount = await Account.findOne({
      _id: accountId,
      user: req.user.id
    }).session(session);

    if (!paymentAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Payment account not found'
      });
    }

    // Check if user account is frozen
    const paymentUser = await User.findById(req.user.id).session(session);
    if (paymentUser?.isFrozen) {
      await session.abortTransaction();
      session.endSession();
      
      // Send email notification to user
      emailService.sendFrozenAccountAlert(paymentUser, 'loan payment').catch(err => 
        logger.error(`Failed to send frozen account email: ${err.message}`)
      );
      
      return res.status(403).json({
        success: false,
        message: 'Your account is frozen. Please contact live support for assistance.',
        code: 'ACCOUNT_FROZEN'
      });
    }

    if (paymentAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in payment account'
      });
    }

    // Verify amount doesn't exceed remaining balance
    if (amount > loan.remainingBalance) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining balance of $${loan.remainingBalance}`
      });
    }

    // Deduct payment from account
    await Account.findByIdAndUpdate(accountId, {
      $inc: { balance: -amount }
    }, { session });

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user.id,
      account: accountId,
      type: 'payment',
      amount,
      description: `Loan payment for loan ${loan.loanId}`,
      category: 'loan',
      status: 'completed',
      metadata: { loanId: loan.loanId }
    }], { session });

    // Calculate new remaining balance
    const newRemainingBalance = loan.remainingBalance - amount;
    const newAmountPaid = loan.amountPaid + amount;

    // Determine if loan is paid off
    let newStatus = loan.status;
    if (newRemainingBalance <= 0) {
      newStatus = 'paid-off';
    }

    // Calculate next payment date if not paid off
    let nextPaymentDate = loan.nextPaymentDate;
    if (newStatus !== 'paid-off') {
      // Move to next month's payment
      nextPaymentDate = new Date(loan.nextPaymentDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    // Add payment to loan
    const paymentRecord = {
      amount,
      date: Date.now(),
      transaction: transaction[0]._id,
      status: 'completed'
    };

    loan = await UserLoan.findByIdAndUpdate(req.params.id, {
      $inc: { remainingBalance: -amount, amountPaid: amount },
      $push: { payments: paymentRecord },
      status: newStatus,
      nextPaymentDate: newStatus === 'paid-off' ? null : nextPaymentDate
    }, {
      new: true,
      runValidators: true,
      session
    }).populate('loanProduct', 'name type');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Loan Payment Made',
      category: 'loan-management',
      severity: 'low',
      description: `Payment of $${amount} made on loan ${loan.loanId}`,
      entity: {
        type: 'Loan',
        id: loan._id
      },
      metadata: {
        amount,
        transactionId: transaction[0].transactionId,
        remainingBalance: loan.remainingBalance
      }
    }], { session });

    // Create notification
    let notificationTitle, notificationMessage;
    if (newStatus === 'paid-off') {
      notificationTitle = 'Congratulations! Loan Paid Off';
      notificationMessage = `Your loan ${loan.loanId} has been fully paid off. Great job!`;
    } else {
      notificationTitle = 'Loan Payment Processed';
      notificationMessage = `Your payment of $${amount} for loan ${loan.loanId} has been processed. Remaining balance: $${loan.remainingBalance}`;
    }

    await Notification.create([{
      user: req.user.id,
      type: 'loan',
      title: notificationTitle,
      message: notificationMessage,
      priority: newStatus === 'paid-off' ? 'high' : 'medium',
      relatedEntity: {
        type: 'Loan',
        id: loan._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all loans (admin only)
// @route   GET /api/v1/loans/admin/all
// @access  Private/Admin
exports.getAllLoans = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Filter options
    let query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.loanType) query['loanProduct.type'] = req.query.loanType;

    const loans = await UserLoan.find(query)
      .populate('user', 'name email')
      .populate('loanProduct', 'name type interestRate')
      .populate('approvedBy', 'name email')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await UserLoan.countDocuments(query);

    res.status(200).json({
      success: true,
      count: loans.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loan statistics (admin only)
// @route   GET /api/v1/admin/loans/stats
// @access  Private/Admin
exports.getLoanStats = async (req, res, next) => {
  try {
    const totalLoans = await UserLoan.countDocuments();
    const pendingLoans = await UserLoan.countDocuments({ status: 'pending' });
    const approvedLoans = await UserLoan.countDocuments({ status: 'approved' });
    const rejectedLoans = await UserLoan.countDocuments({ status: 'rejected' });
    const activeLoans = await UserLoan.countDocuments({ status: 'active' });

    let totalAmount = 0;
    try {
      const amountStats = await UserLoan.aggregate([
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
      ]);
      if (amountStats.length > 0) {
        totalAmount = amountStats[0].totalAmount || 0;
      }
    } catch (aggError) {
      logger.warn('Loan stats aggregation warning:', aggError.message);
    }

    const stats = {
      total: totalLoans,
      pending: pendingLoans,
      approved: approvedLoans,
      rejected: rejectedLoans,
      active: activeLoans,
      totalAmount
    };

    await AuditLog.log({
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'admin_loan_stats_viewed',
      category: 'loan-management',
      description: `Admin viewed loan statistics`,
      entity: { type: 'loan', id: null }
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve loan (admin only)
// @route   PUT /api/v1/loans/admin/:id/approve
// @access  Private/Admin
exports.approveLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { disbursementNotes } = req.body;

    let loan = await UserLoan.findOne({
      _id: req.params.id,
      status: 'pending'
    }).session(session);

    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Pending loan application not found'
      });
    }

    // Calculate dates for disbursement
    const now = new Date();
    const firstPaymentDate = new Date(now);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    const lastPaymentDate = new Date(firstPaymentDate);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + loan.term);

    // Disburse loan funds to the user's account
    const disbursementAccount = await Account.findById(loan.disbursementAccount).session(session);
    if (disbursementAccount) {
      await Account.findByIdAndUpdate(loan.disbursementAccount, {
        $inc: { balance: loan.amount }
      }, { session });

      // Create deposit transaction
      await Transaction.create([{
        user: loan.user,
        account: loan.disbursementAccount,
        type: 'deposit',
        amount: loan.amount,
        description: `Loan disbursement for loan ${loan.loanId}`,
        category: 'loan',
        status: 'completed',
        metadata: { loanId: loan.loanId }
      }], { session });
    }

    // Update loan status
    loan = await UserLoan.findByIdAndUpdate(req.params.id, {
      status: 'active',
      approvedAt: Date.now(),
      approvedBy: req.user.id,
      disbursementDate: Date.now(),
      firstPaymentDate,
      lastPaymentDate,
      nextPaymentDate: firstPaymentDate,
      $push: {
        notes: {
          text: disbursementNotes || 'Loan approved and funds disbursed',
          createdBy: req.user.id
        }
      }
    }, {
      new: true,
      runValidators: true,
      session
    }).populate('user', 'name email').populate('loanProduct', 'name type');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Loan Approved',
      category: 'loan-management',
      severity: 'high',
      description: `Loan ${loan.loanId} approved and $${loan.amount} disbursed`,
      entity: {
        type: 'Loan',
        id: loan._id
      },
      metadata: {
        loanId: loan.loanId,
        amount: loan.amount,
        disbursementAccount: loan.disbursementAccount
      }
    }], { session });

    // Create notification for the user
    await Notification.create([{
      user: loan.user._id,
      type: 'loan',
      title: 'Loan Approved!',
      message: `Your loan application for $${loan.amount} has been approved. The funds have been deposited into your account. Your first payment of $${loan.monthlyPayment} is due on ${firstPaymentDate.toLocaleDateString()}.`,
      priority: 'high',
      relatedEntity: {
        type: 'Loan',
        id: loan._id
      }
    }], { session });

    // Send loan approval email to the user
    try {
      await emailService.sendLoanApprovalEmail(loan.user, loan);
      logger.info(`Loan approval email sent to ${loan.user.email} for loan ${loan.loanId}`);
    } catch (emailErr) {
      logger.error(`Failed to send loan approval email to ${loan.user.email}: ${emailErr.message}`);
      // Don't fail the whole transaction if email fails - continue and commit what's done
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Reject loan (admin only)
// @route   PUT /api/v1/loans/admin/:id/reject
// @access  Private/Admin
exports.rejectLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason'
      });
    }

    let loan = await UserLoan.findOne({
      _id: req.params.id,
      status: 'pending'
    }).session(session);

    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Pending loan application not found'
      });
    }

    // Update loan status
    loan = await UserLoan.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      rejectionReason,
      rejectedAt: Date.now(),
      rejectedBy: req.user.id,
      $push: {
        notes: {
          text: `Loan rejected: ${rejectionReason}`,
          createdBy: req.user.id
        }
      }
    }, {
      new: true,
      runValidators: true,
      session
    }).populate('user', 'name email').populate('loanProduct', 'name type');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Loan Rejected',
      category: 'loan-management',
      severity: 'medium',
      description: `Loan ${loan.loanId} rejected. Reason: ${rejectionReason}`,
      entity: {
        type: 'Loan',
        id: loan._id
      },
      metadata: { loanId: loan.loanId, rejectionReason }
    }], { session });

    // Create notification for the user
    await Notification.create([{
      user: loan.user._id,
      type: 'loan',
      title: 'Loan Application Rejected',
      message: `Your loan application for $${loan.amount} has been rejected. Reason: ${rejectionReason}`,
      priority: 'high',
      relatedEntity: {
        type: 'Loan',
        id: loan._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};