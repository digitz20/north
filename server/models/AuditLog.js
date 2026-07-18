const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'AUD' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  actor: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true
    },
    ip: String,
    userAgent: String
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'user-management', 'account-management', 'transaction-management',
      'kyc-management', 'investment-management', 'loan-management',
      'card-management', 'security', 'system', 'compliance', 'support'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  entity: {
    type: {
      type: String,
      enum: ['user', 'account', 'transaction', 'transfer', 'kyc', 'investment', 'loan', 'card', 'wallet', 'other']
    },
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isComplianceRelevant: {
    type: Boolean,
    default: true
  },
  complianceNotes: String,
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

// Static method to create audit log
auditLogSchema.statics.log = async function({
  actor, action, category, description, entity, before, after, metadata = {}, ip, userAgent
}) {
  const changes = [];
  if (before && after) {
    Object.keys(after).forEach(key => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({
          field: key,
          oldValue: before[key],
          newValue: after[key]
        });
      }
    });
  }

  const log = new this({
    actor: {
      user: actor.user,
      role: actor.role,
      ip: ip || actor.ip,
      userAgent: userAgent || actor.userAgent
    },
    action,
    category,
    description,
    entity,
    before,
    after,
    changes,
    metadata
  });

  return log.save();
};

// Indexes for audit queries
auditLogSchema.index({ 'actor.user': 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ 'entity.id': 1 });
auditLogSchema.index({ logId: 1 }, { unique: true });
auditLogSchema.index({ createdAt: 1, isComplianceRelevant: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);