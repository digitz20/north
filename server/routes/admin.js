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
const { login } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

// Admin public login route
router.route('/login').post(login);

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

// Accounts CRUD
const { getAdminAccounts, getAccount, updateAdminAccount, deleteAdminAccount } = require('../controllers/accountController');
router.route('/accounts')
  .get(protect, authorize('admin', 'super-admin'), getAdminAccounts);
router.route('/accounts/:id')
  .get(protect, authorize('admin', 'super-admin'), getAccount)
  .put(protect, authorize('admin', 'super-admin'), updateAdminAccount)
  .delete(protect, authorize('super-admin'), deleteAdminAccount);

// Transfers CRUD
const { getAllTransfers, getTransfer, updateTransfer, deleteTransfer } = require('../controllers/transferController');
router.route('/transfers')
  .get(protect, authorize('admin', 'super-admin'), getAllTransfers);
router.route('/transfers/:id')
  .get(protect, authorize('admin', 'super-admin'), getTransfer)
  .put(protect, authorize('admin', 'super-admin'), updateTransfer)
  .delete(protect, authorize('super-admin'), deleteTransfer);

// Investments CRUD
const { getAllInvestments, getInvestment, updateInvestment, deleteInvestment } = require('../controllers/investmentController');
router.route('/investments')
  .get(protect, authorize('admin', 'super-admin'), getAllInvestments);
router.route('/investments/:id')
  .get(protect, authorize('admin', 'super-admin'), getInvestment)
  .put(protect, authorize('admin', 'super-admin'), updateInvestment)
  .delete(protect, authorize('super-admin'), deleteInvestment);

// Loans CRUD
const { getAllLoans, getLoan, updateLoan, deleteLoan } = require('../controllers/loanController');
router.route('/loans')
  .get(protect, authorize('admin', 'super-admin'), getAllLoans);
router.route('/loans/:id')
  .get(protect, authorize('admin', 'super-admin'), getLoan)
  .put(protect, authorize('admin', 'super-admin'), updateLoan)
  .delete(protect, authorize('super-admin'), deleteLoan);

module.exports = router;