const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendToUser } = require('../sockets/socketServer');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

// @desc    Setup transaction PIN (first login or profile)
// @route   POST /api/v1/auth/setup-transaction-pin
// @access  Private
exports.setupTransactionPin = async (req, res, next) => {
  try {
    const { pin, confirmPin } = req.body;
    const userId = req.user.id;

    if (!pin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both PIN and confirm PIN'
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PINs do not match'
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits'
      });
    }

    const user = await User.findById(userId).select('+transactionPin');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN already set. Use change PIN instead.'
      });
    }

    const hashedPin = await bcrypt.hash(pin, 12);
    user.transactionPin = hashedPin;
    user.pinSetupRequired = false;
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = undefined;
    await user.save();

    await AuditLog.log({
      actor: { user: userId, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'transaction_pin_setup',
      category: 'security',
      description: 'Transaction PIN setup completed',
      entity: { type: 'user', id: userId }
    });

    sendToUser(userId, 'notification', {
      type: 'security',
      title: 'Transaction PIN Set',
      message: 'Your 4-digit transaction PIN has been set successfully.'
    });

    res.status(200).json({
      success: true,
      message: 'Transaction PIN set successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify transaction PIN
// @route   POST /api/v1/auth/verify-transaction-pin
// @access  Private
exports.verifyTransactionPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide PIN'
      });
    }

    const user = await User.findById(userId).select('+transactionPin +pinLockedUntil');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'No transaction PIN set. Please setup your PIN first.',
        code: 'PIN_NOT_SET'
      });
    }

    if (user.pinLockedUntil && user.pinLockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.pinLockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `PIN locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.`,
        code: 'PIN_LOCKED'
      });
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      user.pinFailedAttempts = (user.pinFailedAttempts || 0) + 1;
      
      if (user.pinFailedAttempts >= 5) {
        user.pinLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.pinFailedAttempts = 0;
        await user.save();
        
        return res.status(423).json({
          success: false,
          message: 'PIN locked for 30 minutes due to too many failed attempts.',
          code: 'PIN_LOCKED'
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: `Invalid PIN. ${5 - user.pinFailedAttempts} attempts remaining.`,
        code: 'INVALID_PIN'
      });
    }

    user.pinFailedAttempts = 0;
    user.pinLockedUntil = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'PIN verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change transaction PIN
// @route   POST /api/v1/auth/change-transaction-pin
// @access  Private
exports.changeTransactionPin = async (req, res, next) => {
  try {
    const { currentPin, newPin, confirmNewPin } = req.body;
    const userId = req.user.id;

    if (!currentPin || !newPin || !confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current PIN, new PIN, and confirm new PIN'
      });
    }

    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'New PINs do not match'
      });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be exactly 4 digits'
      });
    }

    const user = await User.findById(userId).select('+transactionPin');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'No transaction PIN set. Please setup a PIN first.'
      });
    }

    const isCurrentPinValid = await bcrypt.compare(currentPin, user.transactionPin);
    if (!isCurrentPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Current PIN is incorrect'
      });
    }

    const hashedNewPin = await bcrypt.hash(newPin, 12);
    user.transactionPin = hashedNewPin;
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = undefined;
    await user.save();

    await AuditLog.log({
      actor: { user: userId, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'transaction_pin_changed',
      category: 'security',
      description: 'Transaction PIN changed',
      entity: { type: 'user', id: userId }
    });

    sendToUser(userId, 'notification', {
      type: 'security',
      title: 'Transaction PIN Changed',
      message: 'Your transaction PIN has been changed successfully.'
    });

    res.status(200).json({
      success: true,
      message: 'Transaction PIN changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot transaction PIN - initiates reset via email link
// @route   POST /api/v1/auth/forgot-transaction-pin
// @access  Private
exports.forgotTransactionPin = async (req, res, next) => {
  try {
    const { email, ssnLastFour } = req.body;
    const userId = req.user?.id;

    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email: email || req.user.email }).select('+transactionPin +ssnLastFour');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userId && user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!ssnLastFour || !user.ssnLastFour || ssnLastFour !== user.ssnLastFour) {
      return res.status(401).json({
        success: false,
        message: 'Invalid SSN verification. Please provide the last 4 digits of your SSN.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.transactionPinResetToken = resetTokenHash;
    user.transactionPinResetExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-transaction-pin?token=${resetToken}`;

    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'transaction_pin_reset_requested',
      category: 'security',
      description: 'Transaction PIN reset requested via email',
      entity: { type: 'user', id: user._id }
    });

    try {
      await emailService.sendTransactionPinResetLink(user, resetUrl);
    } catch (emailErr) {
      logger.error(`Failed to send PIN reset email: ${emailErr.message}`);
      user.transactionPinResetToken = undefined;
      user.transactionPinResetExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    sendToUser(user._id.toString(), 'notification', {
      type: 'security',
      title: 'Transaction PIN Reset',
      message: 'A PIN reset link has been sent to your email address.'
    });

    res.status(200).json({
      success: true,
      message: 'A PIN reset link has been sent to your email. Please check your inbox and follow the instructions.',
      data: {
        email: user.email,
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset transaction PIN using reset token
// @route   POST /api/v1/auth/reset-transaction-pin
// @access  Public
exports.resetTransactionPin = async (req, res, next) => {
  try {
    const { token, newPin, confirmNewPin } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!newPin || !confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both new PIN and confirm PIN'
      });
    }

    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'PINs do not match'
      });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      transactionPinResetToken: tokenHash,
      transactionPinResetExpire: { $gt: Date.now() }
    }).select('+transactionPin +transactionPinResetToken');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new PIN reset.'
      });
    }

    const hashedPin = await bcrypt.hash(newPin, 12);
    user.transactionPin = hashedPin;
    user.pinSetupRequired = false;
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = undefined;
    user.transactionPinResetToken = undefined;
    user.transactionPinResetExpire = undefined;
    await user.save();

    await AuditLog.log({
      actor: { user: user._id, role: user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'transaction_pin_reset',
      category: 'security',
      description: 'Transaction PIN reset via email link',
      entity: { type: 'user', id: user._id }
    });

    try {
      await emailService.sendTransactionPinChangedNotification(user);
    } catch (emailErr) {
      logger.error(`Failed to send PIN changed notification: ${emailErr.message}`);
    }

    sendToUser(user._id.toString(), 'notification', {
      type: 'security',
      title: 'Transaction PIN Changed',
      message: 'Your transaction PIN has been successfully reset.'
    });

    res.status(200).json({
      success: true,
      message: 'Transaction PIN has been successfully reset. You may now log in with your new PIN.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if user has PIN setup required
// @route   GET /api/v1/auth/pin-status
// @access  Private
exports.getPinStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('pinSetupRequired');
    
    res.status(200).json({
      success: true,
      data: {
        pinSetupRequired: user?.pinSetupRequired || false,
        hasPin: !!user?.transactionPin
      }
    });
  } catch (error) {
    next(error);
  }
};
