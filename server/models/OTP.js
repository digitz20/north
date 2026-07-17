const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otpId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'OTP' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  code: {
    type: String,
    required: true,
    select: false
  },
  purpose: {
    type: String,
    enum: [
      'login', 'password-reset', 'email-verification', 
      'phone-verification', 'transaction-approval',
      'withdrawal-approval', 'transfer-approval',
      'account-recovery'
    ],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: Date,
  isUsed: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: Date,
  ip: String,
  userAgent: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Static method to generate OTP
otpSchema.statics.generate = async function(userId, purpose, expiresIn = 15 * 60 * 1000, length = 6) {
  // Delete any existing unused OTPs for this user and purpose
  await this.deleteMany({
    user: userId,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  // Generate random OTP code
  const code = Math.random().toString().slice(2, 2 + length);
  
  const otp = new this({
    user: userId,
    code,
    purpose,
    expiresAt: new Date(Date.now() + expiresIn)
  });

  await otp.save();
  return otp;
};

// Static method to verify OTP
otpSchema.statics.verify = async function(otpId, code) {
  const otp = await this.findOne({
    _id: otpId,
    isUsed: false,
    isBlocked: false,
    expiresAt: { $gt: new Date() }
  }).select('+code');

  if (!otp) {
    return { success: false, message: 'OTP not found or expired' };
  }

  if (otp.code !== code) {
    otp.failedAttempts += 1;
    
    if (otp.failedAttempts >= otp.maxAttempts) {
      otp.isBlocked = true;
      otp.blockedAt = new Date();
    }
    
    await otp.save();
    return { success: false, message: 'Invalid OTP code' };
  }

  // Mark as used
  otp.isUsed = true;
  otp.verified = true;
  otp.usedAt = new Date();
  await otp.save();

  return { success: true, otp };
};

// Indexes
otpSchema.index({ user: 1, purpose: 1, isUsed: 1 });
otpSchema.index({ otpId: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire documents

module.exports = mongoose.model('OTP', otpSchema);