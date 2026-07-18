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
  uploadProfilePicture
} = require('../controllers/authController');
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

module.exports = router;