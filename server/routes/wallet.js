const express = require('express');
const router = express.Router();
const {
  getWallet,
  addFunds,
  withdrawFunds,
  getWalletTransactions
} = require('../controllers/walletController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getWallet);

router.route('/transactions')
  .get(protect, getWalletTransactions);

router.route('/add-funds')
  .post(protect, addFunds);

router.route('/withdraw-funds')
  .post(protect, withdrawFunds);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/walletController').getAllWallets);

module.exports = router;