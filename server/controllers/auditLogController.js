const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// @desc    Get all audit logs (admin only)
// @route   GET /api/v1/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    const filters = {};
    if (req.query.action) filters.action = new RegExp(req.query.action, 'i');
    if (req.query.category) filters.category = req.query.category;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) filters.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filters.createdAt.$lte = new Date(req.query.endDate);
    }

    const total = await AuditLog.countDocuments(filters);
    const logs = await AuditLog.find(filters)
      .populate('actor.user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        logs,
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

// @desc    Get audit log statistics (admin only)
// @route   GET /api/v1/admin/audit-logs/stats
// @access  Private/Admin
exports.getAuditLogStats = async (req, res, next) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = await AuditLog.countDocuments({ createdAt: { $gte: today } });
    
    const criticalEvents = await AuditLog.countDocuments({ severity: 'critical' });
    
    const actionBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const categoryBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        criticalEvents,
        actionBreakdown,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};
