const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const logger = require('../utils/logger');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is disabled'
      });
    }

    // Get active session
    const session = await Session.findOne({
      user: decoded.id,
      token,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Update session last activity
    await session.updateActivity(req.originalUrl);

    // Add user to request object
    req.user = user;
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Verify email is confirmed
exports.isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first'
    });
  }
  next();
};

// Verify KYC is completed for certain operations
exports.requiresKYC = (level = 1) => {
  return async (req, res, next) => {
    const KYC = require('../models/KYC');
    const kyc = await KYC.findOne({ user: req.user._id });
    
    if (!kyc || kyc.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'KYC verification is required to perform this action'
      });
    }

    if (kyc.level < level) {
      return res.status(403).json({
        success: false,
        message: `Enhanced KYC verification (level ${level}) is required`
      });
    }

    req.kyc = kyc;
    next();
  };
};