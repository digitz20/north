const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getSystemLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Admin-only routes (all routes require admin or super-admin)
router.route('/dashboard')
  .get(protect, authorize('admin', 'super-admin'), getDashboardStats);

router.route('/users')
  .get(protect, authorize('admin', 'super-admin'), getUsers);

router.route('/users/:id')
  .get(protect, authorize('admin', 'super-admin'), getUser)
  .put(protect, authorize('admin', 'super-admin'), updateUser)
  .delete(protect, authorize('super-admin'), deleteUser);

router.route('/logs')
  .get(protect, authorize('admin', 'super-admin'), getSystemLogs);

module.exports = router;