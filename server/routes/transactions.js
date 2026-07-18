const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  deposit,
  withdraw
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getTransactions);

router.route('/:id')
  .get(protect, getTransaction);

router.route('/deposit')
  .post(protect, deposit);

router.route('/crypto-deposit')
  .post(protect, require('../controllers/transactionController').cryptoDeposit);

router.route('/withdraw')
  .post(protect, withdraw);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/transactionController').getAllTransactions);

router.route('/admin/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/transactionController').approveTransaction);

router.route('/admin/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/transactionController').rejectTransaction);

module.exports = router;