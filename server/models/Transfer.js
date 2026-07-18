const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  sender: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    }
  },
  recipient: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: String,
    bankName: String,
    routingNumber: String,
    accountNumber: String
  },
  transferId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TRF' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Transfer amount must be greater than 0']
  },
  proofs: [{
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  transferType: {
    type: String,
    enum: ['internal', 'external', 'same-bank'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  fee: {
    type: Number,
    default: 0
  },
  scheduledDate: {
    type: Date
  },
  processedAt: Date,
  completedAt: Date,
  failureReason: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly']
  },
  nextScheduledDate: Date,
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
}, {
  timestamps: true
});

// Indexes
transferSchema.index({ 'sender.user': 1, createdAt: -1 });
transferSchema.index({ 'recipient.user': 1, createdAt: -1 });
transferSchema.index({ transferId: 1 }, { unique: true });
transferSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Transfer', transferSchema);