const express = require('express');
const router = express.Router();
const {
  getLoans,
  getLoan,
  applyForLoan,
  makePayment,
  calculateEligibility
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

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/loanController').getAllLoans);

router.route('/admin/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/loanController').approveLoan);

router.route('/admin/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/loanController').rejectLoan);

module.exports = router;