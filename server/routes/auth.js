const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  verifyEmail,
  resendVerificationEmail,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  uploadProfilePicture,
  changePassword
} = require('../controllers/authController');
const {
  setupTransactionPin,
  verifyTransactionPin,
  changeTransactionPin,
  forgotTransactionPin,
  resetTransactionPin,
  getPinStatus
} = require('../controllers/pinController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/add-saved-wallet', protect, require('../controllers/authController').addSavedWallet);
router.post('/initialize-saved-wallets', protect, require('../controllers/authController').initializeSavedWallets);
router.put('/profile-picture', protect, uploadProfilePicture);
router.post('/settings', protect, require('../controllers/authController').updateSettings);
router.post('/change-password', protect, changePassword);

// Transaction PIN routes
router.post('/setup-transaction-pin', protect, setupTransactionPin);
router.post('/verify-transaction-pin', protect, verifyTransactionPin);
router.post('/change-transaction-pin', protect, changeTransactionPin);
router.post('/forgot-transaction-pin', protect, forgotTransactionPin);
router.post('/reset-transaction-pin', resetTransactionPin);
router.get('/pin-status', protect, getPinStatus);

module.exports = router;