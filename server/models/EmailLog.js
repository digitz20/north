const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    index: true
  },
  cc: {
    type: [String],
    default: []
  },
  bcc: {
    type: [String],
    default: []
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String
  },
  category: {
    type: String,
    enum: ['verification', 'transaction', 'investment', 'loan', 'support', 'system', 'marketing', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'bounced', 'delivered'],
    default: 'sent'
  },
  messageId: String,
  error: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  sentBy: {
    type: String,
    enum: ['system', 'admin', 'user-action'],
    default: 'system'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  relatedModel: String,
  relatedId: mongoose.Schema.Types.ObjectId
}, {
  timestamps: true
});

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ to: 1, createdAt: -1 });
emailLogSchema.index({ category: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
