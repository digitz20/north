const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  token: {
    type: String,
    required: true,
    select: false
  },
  refreshToken: {
    type: String,
    required: true,
    select: false
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  browser: String,
  os: String,
  device: String,
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  terminatedAt: Date,
  terminationReason: {
    type: String,
    enum: ['user-logout', 'expired', 'security-failure', 'admin-termination', 'other']
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isTrusted: {
    type: Boolean,
    default: false
  },
  requires2FA: {
    type: Boolean,
    default: true
  },
  twoFAVerified: {
    type: Boolean,
    default: false
  },
  activityLog: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String,
    endpoint: String
  }]
}, {
  timestamps: true
});

// Update last activity
sessionSchema.methods.updateActivity = async function(endpoint) {
  this.lastActivity = new Date();
  this.activityLog.push({
    action: 'page-view',
    timestamp: new Date(),
    ip: this.ip,
    endpoint
  });
  return this.save();
};

// Terminate session
sessionSchema.methods.terminate = async function(reason, terminatedBy) {
  this.isActive = false;
  this.terminatedAt = new Date();
  this.terminationReason = reason;
  if (terminatedBy) {
    this.terminatedBy = terminatedBy;
  }
  return this.save();
};

// Static method to clean expired sessions
sessionSchema.statics.cleanExpired = async function() {
  const expired = await this.find({
    isActive: true,
    expiresAt: { $lt: new Date() }
  });
  
  for (const session of expired) {
    await session.terminate('expired');
  }
  
  return expired.length;
};

// Indexes
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ sessionId: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);