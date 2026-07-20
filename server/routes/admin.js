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
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { getAuditLogs, getAuditLogStats } = require('../controllers/auditLogController');
const { getTransactionReport, getUsersReport, getAccountsReport, getLoansReport, getInvestmentsReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

// Admin public login route
router.route('/login').post(login);

// Admin-only routes (all routes require admin or super-admin)
router.route('/dashboard')
  .get(protect, authorize('admin', 'super-admin'), getDashboardStats);
// Alias for frontend that requests /dashboard/stats
router.route('/dashboard/stats')
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
const { getAdminAccounts, getAccount, adminGetAccount, updateAdminAccount, deleteAdminAccount } = require('../controllers/accountController');
router.route('/accounts')
  .get(protect, authorize('admin', 'super-admin'), getAdminAccounts);
router.route('/accounts/:id')
  .get(protect, authorize('admin', 'super-admin'), adminGetAccount)
  .put(protect, authorize('admin', 'super-admin'), updateAdminAccount)
  .patch(protect, authorize('admin', 'super-admin'), updateAdminAccount)
  .delete(protect, authorize('super-admin'), deleteAdminAccount);

// Transactions CRUD (admin)
const { getAllTransactions, getTransactionStats } = require('../controllers/transactionController');
router.route('/transactions')
  .get(protect, authorize('admin', 'super-admin'), getAllTransactions);
router.route('/transactions/stats')
  .get(protect, authorize('admin', 'super-admin'), getTransactionStats);

// Transfers CRUD
const { getAllTransfers, getTransfer, updateTransfer, deleteTransfer, getTransferStats } = require('../controllers/transferController');
router.route('/transfers')
  .get(protect, authorize('admin', 'super-admin'), getAllTransfers);
router.route('/transfers/stats')
  .get(protect, authorize('admin', 'super-admin'), getTransferStats);
// Alias for frontend that requests /transactions/recent
router.route('/transactions/recent')
  .get(protect, authorize('admin', 'super-admin'), getAllTransfers);
router.route('/transfers/:id')
  .get(protect, authorize('admin', 'super-admin'), getTransfer)
  .put(protect, authorize('admin', 'super-admin'), updateTransfer)
  .delete(protect, authorize('super-admin'), deleteTransfer);

// Investments CRUD
const { getAllInvestments, getInvestment, updateInvestment, deleteInvestment, getInvestmentStats } = require('../controllers/investmentController');
router.route('/investments')
  .get(protect, authorize('admin', 'super-admin'), getAllInvestments);
router.route('/investments/stats')
  .get(protect, authorize('admin', 'super-admin'), getInvestmentStats);
router.route('/investments/:id')
  .get(protect, authorize('admin', 'super-admin'), getInvestment)
  .put(protect, authorize('admin', 'super-admin'), updateInvestment)
  .patch(protect, authorize('admin', 'super-admin'), updateInvestment)
  .delete(protect, authorize('super-admin'), deleteInvestment);

// Loans CRUD
const { getAllLoans, getLoan, getLoanStats, updateLoan, deleteLoan } = require('../controllers/loanController');
router.route('/loans')
  .get(protect, authorize('admin', 'super-admin'), getAllLoans);
router.route('/loans/stats')
  .get(protect, authorize('admin', 'super-admin'), getLoanStats);
router.route('/loans/:id')
  .get(protect, authorize('admin', 'super-admin'), getLoan)
  .put(protect, authorize('admin', 'super-admin'), updateLoan)
  .patch(protect, authorize('admin', 'super-admin'), updateLoan)
  .delete(protect, authorize('super-admin'), deleteLoan);

// KYC CRUD (admin)
const { getAllKYCs, approveKYC, rejectKYC } = require('../controllers/kycController');
router.route('/kyc')
  .get(protect, authorize('admin', 'super-admin'), getAllKYCs);
router.route('/kyc/:id/approve')
  .put(protect, authorize('admin', 'super-admin'), approveKYC)
  .patch(protect, authorize('admin', 'super-admin'), approveKYC);
router.route('/kyc/:id/reject')
  .put(protect, authorize('admin', 'super-admin'), rejectKYC)
  .patch(protect, authorize('admin', 'super-admin'), rejectKYC);
router.route('/kyc/:id')
  .patch(protect, authorize('admin', 'super-admin'), (req, res, next) => {
    const { status } = req.body;
    if (status === 'approved') return approveKYC(req, res, next);
    if (status === 'rejected') return rejectKYC(req, res, next);
    return res.status(400).json({ success: false, message: 'Invalid status' });
  });

// Settings
router.route('/settings')
  .get(protect, authorize('admin', 'super-admin'), getSettings)
  .post(protect, authorize('admin', 'super-admin'), updateSettings);

// Audit Logs
router.route('/audit-logs')
  .get(protect, authorize('admin', 'super-admin'), getAuditLogs);
router.route('/audit-logs/stats')
  .get(protect, authorize('admin', 'super-admin'), getAuditLogStats);

// Reports
router.route('/reports/transactions')
  .get(protect, authorize('admin', 'super-admin'), getTransactionReport);
router.route('/reports/users')
  .get(protect, authorize('admin', 'super-admin'), getUsersReport);
router.route('/reports/accounts')
  .get(protect, authorize('admin', 'super-admin'), getAccountsReport);
router.route('/reports/loans')
  .get(protect, authorize('admin', 'super-admin'), getLoansReport);
router.route('/reports/investments')
  .get(protect, authorize('admin', 'super-admin'), getInvestmentsReport);

// Support ticket actions
const { closeTicket, assignTicket } = require('../controllers/supportController');
router.route('/support-tickets')
  .get(protect, authorize('admin', 'super-admin', 'support'), require('../controllers/supportController').getAllTickets);
router.route('/support-tickets/:id/assign')
  .put(protect, authorize('admin', 'super-admin', 'support'), assignTicket);
router.route('/support-tickets/:id/close')
  .put(protect, authorize('admin', 'super-admin', 'support'), closeTicket)
  .patch(protect, authorize('admin', 'super-admin', 'support'), closeTicket);
router.route('/support-tickets/:id')
  .patch(protect, authorize('admin', 'super-admin', 'support'), (req, res, next) => {
    const { status } = req.body;
    if (status === 'closed') return closeTicket(req, res, next);
    if (status === 'active') return assignTicket(req, res, next);
    return res.status(400).json({ success: false, message: 'Invalid status' });
  });

module.exports = router;