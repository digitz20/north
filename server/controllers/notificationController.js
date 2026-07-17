const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

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