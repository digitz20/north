const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  closeAccount
} = require('../controllers/accountController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getAccounts)
  .post(protect, createAccount);

router.route('/:id')
  .get(protect, getAccount)
  .put(protect, updateAccount)
  .delete(protect, closeAccount);

// Admin-only routes
router.route('/admin/:id/freeze')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/accountController').freezeAccount);

router.route('/admin/:id/unfreeze')
  .put(protect, authorize('admin', 'super-admin'), require('../controllers/accountController').unfreezeAccount);

module.exports = router;