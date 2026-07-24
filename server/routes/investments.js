const express = require('express');
const router = express.Router();
const {
  getInvestments,
  getInvestment,
  createInvestment,
  sellInvestment,
  getInvestmentTypes
} = require('../controllers/investmentController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getInvestments)
  .post(protect, createInvestment);

router.route('/types')
  .get(protect, getInvestmentTypes);

router.route('/:id')
  .get(protect, getInvestment);

router.route('/:id/sell')
  .post(protect, sellInvestment);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/investmentController').getAllInvestments);

router.route('/admin/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/investmentController').approveInvestment);

router.route('/admin/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/investmentController').rejectInvestment);

module.exports = router;