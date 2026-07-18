const express = require('express');
const router = express.Router();
const {
  getLoans,
  getLoan,
  applyForLoan,
  makePayment,
  calculateEligibility,
  submitTaxRefund,
  getAllTaxRefunds,
  getTaxRefund,
  updateTaxRefundStatus,
  deleteTaxRefund,
  getAllLoans,
  approveLoan,
  rejectLoan
} = require('../controllers/loanController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getLoans)
  .post(protect, applyForLoan);

router.route('/eligibility')
  .post(protect, calculateEligibility);

router.route('/:id')
  .get(protect, getLoan);

router.route('/:id/payment')
  .post(protect, makePayment);

router.route('/tax-refund')
  .post(protect, submitTaxRefund);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), getAllLoans);

router.route('/admin/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), approveLoan);

router.route('/admin/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), rejectLoan);

// Tax refund admin routes
router.route('/admin/tax-refunds')
  .get(protect, authorize('admin', 'super-admin'), getAllTaxRefunds);

router.route('/admin/tax-refunds/:id/update')
  .put(protect, authorize('admin', 'super-admin'), updateTaxRefundStatus);

router.route('/admin/tax-refunds/:id')
  .get(protect, authorize('admin', 'super-admin'), getTaxRefund)
  .delete(protect, authorize('admin', 'super-admin'), deleteTaxRefund);

router.route('/admin/tax-refunds/:id/update')
  .put(protect, authorize('admin', 'super-admin'), updateTaxRefundStatus);

module.exports = router;