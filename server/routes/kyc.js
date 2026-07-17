const express = require('express');
const router = express.Router();
const {
  submitKYC,
  getKYCStatus,
  uploadDocument
} = require('../controllers/kycController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getKYCStatus)
  .post(protect, submitKYC);

router.route('/documents')
  .post(protect, uploadDocument);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/kycController').getAllKYCs);

router.route('/admin/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/kycController').approveKYC);

router.route('/admin/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/kycController').rejectKYC);

module.exports = router;