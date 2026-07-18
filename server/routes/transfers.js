const express = require('express');
const router = express.Router();
const {
  createTransfer,
  createInternationalTransfer,
  getTransfers,
  getTransfer
} = require('../controllers/transferController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getTransfers)
  .post(protect, createTransfer);

router.route('/international')
  .post(protect, createInternationalTransfer);

router.route('/:id')
  .get(protect, getTransfer);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/transferController').getAllTransfers);

router.route('/admin/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/transferController').approveTransfer);

router.route('/admin/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/transferController').rejectTransfer);

module.exports = router;