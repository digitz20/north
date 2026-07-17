const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'NTF' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  type: {
    type: String,
    enum: [
      'transaction', 'transfer', 'deposit', 'withdrawal',
      'investment', 'loan', 'card', 'account', 'security',
      'system', 'kyc', 'support', 'promotional'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['transaction', 'transfer', 'loan', 'investment', 'card', 'kyc', 'support']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  channels: [{
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
    default: ['in-app']
  }],
  sentChannels: [{
    channel: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  }],
  imageUrl: String,
  actionUrl: String,
  actionLabel: String
}, {
  timestamps: true
});

// Mark as read method
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Indexes for fast queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ notificationId: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);