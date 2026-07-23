const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const emailService = require('../utils/email');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all user notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = { user: req.user.id };
    if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true';
    if (req.query.type) filters.type = req.query.type;
    
    const total = await Notification.countDocuments(filters);
    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get unread count for client
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'notifications_viewed',
      category: 'system',
      description: `User viewed their notifications`,
      metadata: { filters, total, unreadCount }
    });

    res.status(200).json({
      success: true,
      data: { notifications, total, unreadCount, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single notification
// @route   GET /api/v1/notifications/:id
// @access  Private
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'notification_viewed',
      category: 'system',
      description: `User viewed notification ${notification.notificationId}`,
      entity: { type: 'user', id: notification._id, name: notification.notificationId }
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!notification) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Use the model's built-in markAsRead method
    await notification.markAsRead();

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'notification_marked_read',
      category: 'system',
      description: `User marked notification ${notification.notificationId} as read`,
      entity: { type: 'user', id: notification._id, name: notification.notificationId },
      before: { isRead: false },
      after: { isRead: true, readAt: new Date() }
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully',
      data: notification
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Send email notification
// @route   POST /api/v1/notifications/send-email
// @access  Private
exports.sendEmail = async (req, res, next) => {
  try {
    const { email, type, transactionDetails } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Email type is required'
      });
    }

    // Find the user to get their details
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found to send email'
      });
    }

    const validTypes = [
      'withdrawal_confirmation',
      'deposit_confirmation',
      'international_transfer_confirmation'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported email type: ${type}`,
        validTypes
      });
    }

    const safeTransactionDetails = transactionDetails || {};

    // Send the appropriate email based on type
    switch (type) {
      case 'withdrawal_confirmation':
        await emailService.sendTransactionAlert(user, {
          transactionId: safeTransactionDetails.transactionId,
          amount: safeTransactionDetails.amount,
          status: safeTransactionDetails.status || 'completed',
          direction: 'sent',
          type: 'Withdrawal',
          description: 'Your withdrawal has been processed'
        });
        logger.info(`Withdrawal confirmation email sent to: ${email}`);
        break;

      case 'deposit_confirmation':
        await emailService.sendCryptoDepositConfirmationEmail(user, {
          amount: safeTransactionDetails.amount,
          crypto: safeTransactionDetails.crypto,
          network: safeTransactionDetails.network,
          destinationAccount: safeTransactionDetails.destinationAccount,
          transactionId: safeTransactionDetails.transactionId,
          transactionHash: safeTransactionDetails.transactionHash,
          investmentDetails: safeTransactionDetails.investmentDetails
        }, email);
        logger.info(`Deposit confirmation email sent to: ${email}`);
        break;

      case 'international_transfer_confirmation':
        await emailService.sendTransactionAlert(user, {
          transactionId: safeTransactionDetails.transactionId,
          amount: safeTransactionDetails.amount,
          status: safeTransactionDetails.status || 'completed',
          direction: 'sent',
          type: safeTransactionDetails.method === 'wire-transfer' ? 'wire-transfer' : safeTransactionDetails.method === 'bank-transfer' ? 'bank-transfer' : 'international',
          description: safeTransactionDetails.description || 'Your international transfer has been initiated',
          method: safeTransactionDetails.method
        });
        logger.info(`International transfer confirmation email sent to: ${email}`);
        break;
    }

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updateResult = await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
      { session }
    );

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'all_notifications_marked_read',
      category: 'system',
      description: `User marked all ${updateResult.modifiedCount} notifications as read`,
      metadata: { markedAsRead: updateResult.modifiedCount }
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read successfully',
      data: { markedAsRead: updateResult.modifiedCount }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!notification) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'notification_deleted',
      category: 'system',
      description: `User deleted notification ${notification.notificationId}`,
      entity: { type: 'user', id: notification._id, name: notification.notificationId }
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all notifications (admin only)
// @route   GET /api/v1/notifications/admin/all
// @access  Private/Admin
exports.getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true';
    if (req.query.type) filters.type = req.query.type;
    if (req.query.userId) filters.user = req.query.userId;
    
    const total = await Notification.countDocuments(filters);
    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'fullName email');

    await AuditLog.log({
      actor: { user: req.user.id, role: 'admin', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'all_notifications_viewed',
      category: 'system',
      description: `Admin viewed all platform notifications`,
      metadata: { filters, total }
    });

    res.status(200).json({
      success: true,
      data: { notifications, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};