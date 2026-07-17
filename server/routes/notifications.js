const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getNotifications);

router.route('/mark-all-read')
  .put(protect, markAllAsRead);

router.route('/:id')
  .get(protect, getNotification)
  .delete(protect, deleteNotification);

router.route('/:id/read')
  .put(protect, markAsRead);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/notificationController').getAllNotifications);

module.exports = router;