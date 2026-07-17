const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TXN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  type: {
    type: String,
    enum: [
      'deposit', 'withdrawal', 'transfer', 'payment', 
      'investment', 'loan', 'fee', 'interest', 'refund'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [255, 'Description cannot exceed 255 characters']
  },
  category: {
    type: String,
    enum: [
      'entertainment', 'food', 'shopping', 'transportation',
      'utilities', 'healthcare', 'education', 'transfer',
      'deposit', 'withdrawal', 'investment', 'loan', 'other'
    ],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  direction: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  sender: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    name: String,
    email: String
  },
  recipient: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    name: String,
    email: String,
    bankName: String,
    routingNumber: String,
    accountNumber: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  processedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ 'sender.account': 1 });
transactionSchema.index({ 'recipient.account': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);