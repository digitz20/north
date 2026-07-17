const KYC = require('../models/KYC');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get user KYC status
// @route   GET /api/v1/kyc
// @access  Private
exports.getKYCStatus = async (req, res, next) => {
  try {
    const kyc = await KYC.findOne({ user: req.user.id })
      .select('-documents.idDocument.ssn -riskAssessment -verificationDetails')
      .populate('user', 'firstName lastName email');

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'kyc_status_viewed',
      category: 'kyc-management',
      description: `User viewed their KYC status: ${kyc.status}`,
      entity: { type: 'kyc', id: kyc._id, name: kyc.kycId }
    });

    res.status(200).json({
      success: true,
      data: kyc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit KYC information
// @route   POST /api/v1/kyc
// @access  Private
exports.submitKYC = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      type,
      personalInfo,
      employment,
      businessInfo
    } = req.body;

    // Validate required fields
    if (!personalInfo || !personalInfo.firstName || !personalInfo.lastName || !personalInfo.dateOfBirth) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide required personal information'
      });
    }

    // Find existing KYC record
    let kyc = await KYC.findOne({ user: req.user.id });
    if (!kyc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    // Check if KYC is already submitted or approved
    if (kyc.status !== 'not-submitted' && kyc.status !== 'rejected' && kyc.status !== 'additional-info-needed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot resubmit KYC with current status: ${kyc.status}`
      });
    }

    // Prepare update data
    const updateData = {
      type: type || 'individual',
      status: 'pending',
      submittedAt: new Date(),
      personalInfo: {
        ...kyc.personalInfo,
        ...personalInfo
      },
      history: [
        ...kyc.history,
        {
          status: 'pending',
          comment: 'KYC application submitted for review',
          changedBy: req.user.id,
          changedAt: new Date()
        }
      ]
    };

    // Add employment info if provided
    if (employment) {
      updateData.employment = employment;
    }

    // Add business info if it's a business account
    if (type === 'business' && businessInfo) {
      updateData.businessInfo = businessInfo;
    }

    // Update KYC record
    kyc = await KYC.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, session }
    );

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'kyc_submitted',
      category: 'kyc-management',
      description: `User submitted KYC application: ${kyc.kycId}`,
      entity: { type: 'kyc', id: kyc._id, name: kyc.kycId },
      metadata: { type: kyc.type }
    });

    // Create notification for user
    await Notification.create({
      user: req.user.id,
      type: 'kyc',
      title: 'KYC Application Submitted',
      message: 'Your KYC application has been submitted and is pending review.',
      relatedModel: 'KYC',
      relatedId: kyc._id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'KYC application submitted successfully',
      data: kyc
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Upload KYC document
// @route   POST /api/v1/kyc/documents
// @access  Private
exports.uploadDocument = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      documentType,
      documentData
    } = req.body;

    // Validate required fields
    if (!documentType || !documentData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide document type and data'
      });
    }

    // Find user's KYC record
    const kyc = await KYC.findOne({ user: req.user.id });
    if (!kyc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    // Validate document type
    const validDocumentTypes = ['idDocument', 'proofOfAddress', 'selfieImage', 'additionalDocuments'];
    if (!validDocumentTypes.includes(documentType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    // Handle additional documents separately
    if (documentType === 'additionalDocuments') {
      kyc.documents.additionalDocuments.push({
        ...documentData,
        uploadedAt: new Date()
      });
    } else {
      // Update main document
      kyc.documents[documentType] = {
        ...kyc.documents[documentType],
        ...documentData
      };
    }

    await kyc.save({ session });

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'kyc_document_uploaded',
      category: 'kyc-management',
      description: `User uploaded ${documentType} for KYC: ${kyc.kycId}`,
      entity: { type: 'kyc', id: kyc._id, name: kyc.kycId },
      metadata: { documentType }
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: kyc.documents
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all KYC applications (admin only)
// @route   GET /api/v1/kyc/admin/all
// @access  Private/Admin
exports.getAllKYCs = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    const total = await KYC.countDocuments(query);
    const kycs = await KYC.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 })
      .skip(startIndex)
      .limit(limit);

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'kyc_applications_viewed',
      category: 'kyc-management',
      description: `Admin viewed all KYC applications (page ${page})`,
      entity: { type: 'kyc', id: null, name: 'KYC List' },
      metadata: { total, page, limit, status }
    });

    res.status(200).json({
      success: true,
      data: {
        kycs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve KYC application (admin only)
// @route   PUT /api/v1/kyc/admin/:id/approve
// @access  Private/Admin
exports.approveKYC = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { level = 2, notes } = req.body; // Default to level 2 (verified)
    
    // Find KYC record
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'KYC application not found'
      });
    }

    // Check if already approved
    if (kyc.status === 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'KYC application is already approved'
      });
    }

    const before = { status: kyc.status };
    
    // Update KYC record
    kyc.status = 'approved';
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = req.user.id;
    kyc.level = level;
    kyc.verificationDetails.notes = notes || kyc.verificationDetails.notes;
    kyc.history.push({
      status: 'approved',
      comment: notes || 'KYC application approved',
      changedBy: req.user.id,
      changedAt: new Date()
    });

    // Set transaction limits based on level
    const limits = { 1: 10000, 2: 100000, 3: 1000000 };
    kyc.annualTransactionLimit = limits[level] || 10000;

    await kyc.save({ session });

    // Update user's KYC status
    await User.findByIdAndUpdate(
      kyc.user,
      { kycVerified: true, kycLevel: level },
      { session }
    );

    const after = { status: kyc.status, level: kyc.level };

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'kyc_approved',
      category: 'kyc-management',
      severity: 'high',
      description: `Admin approved KYC application: ${kyc.kycId} (level ${level})`,
      entity: { type: 'kyc', id: kyc._id, name: kyc.kycId },
      before,
      after,
      metadata: { level, notes }
    });

    // Create notification for user
    await Notification.create({
      user: kyc.user,
      type: 'kyc',
      title: 'KYC Application Approved',
      message: `Your KYC application has been approved. You now have access to all features with level ${level} verification.`,
      relatedModel: 'KYC',
      relatedId: kyc._id,
      priority: 'high'
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'KYC application approved successfully',
      data: kyc
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Reject KYC application (admin only)
// @route   PUT /api/v1/kyc/admin/:id/reject
// @access  Private/Admin
exports.rejectKYC = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { rejectionReason, requestAdditionalInfo = false } = req.body;
    
    if (!rejectionReason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason'
      });
    }

    // Find KYC record
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'KYC application not found'
      });
    }

    // Check if already processed
    if (kyc.status === 'approved' || kyc.status === 'rejected') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot reject KYC with current status: ${kyc.status}`
      });
    }

    const before = { status: kyc.status };
    
    // Update KYC record
    kyc.status = requestAdditionalInfo ? 'additional-info-needed' : 'rejected';
    kyc.rejectionReason = rejectionReason;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = req.user.id;
    kyc.history.push({
      status: requestAdditionalInfo ? 'additional-info-needed' : 'rejected',
      comment: rejectionReason,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    await kyc.save({ session });

    const after = { status: kyc.status };

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: requestAdditionalInfo ? 'kyc_additional_info_requested' : 'kyc_rejected',
      category: 'kyc-management',
      severity: 'medium',
      description: `Admin ${requestAdditionalInfo ? 'requested additional information for' : 'rejected'} KYC application: ${kyc.kycId}`,
      entity: { type: 'kyc', id: kyc._id, name: kyc.kycId },
      before,
      after,
      metadata: { rejectionReason, requestAdditionalInfo }
    });

    // Create notification for user
    await Notification.create({
      user: kyc.user,
      type: 'kyc',
      title: requestAdditionalInfo ? 'Additional Information Required' : 'KYC Application Rejected',
      message: requestAdditionalInfo 
        ? `We need additional information to process your KYC application: ${rejectionReason}`
        : `Your KYC application has been rejected. Reason: ${rejectionReason}`,
      relatedModel: 'KYC',
      relatedId: kyc._id,
      priority: 'high'
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: requestAdditionalInfo 
        ? 'Additional information requested successfully' 
        : 'KYC application rejected successfully',
      data: kyc
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};