const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: () => Math.floor(1000000000 + Math.random() * 9000000000).toString()
  },
  routingNumber: {
    type: String,
    required: true,
    default: '021000021' // Default US routing number format
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'money-market', 'cd'],
    required: true
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: [30, 'Nickname cannot exceed 30 characters']
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dailyTransferLimit: {
    type: Number,
    default: 5000
  },
  dailyTransfersUsed: {
    type: Number,
    default: 0
  },
  lastDailyReset: {
    type: Date,
    default: Date.now
  },
  openedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate account number before saving
accountSchema.pre('save', async function(next) {
  // Always generate account number if it's missing, even if something unexpected happens
  if (!this.accountNumber) {
    // Generate a unique 10-digit account number
    this.accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
  next();
});

// Ensure only one primary account per user
accountSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

// Virtual to get formatted account number
accountSchema.virtual('formattedAccountNumber').get(function() {
  return `****${this.accountNumber.slice(-4)}`;
});

// Index for faster queries
accountSchema.index({ user: 1, accountType: 1 });
accountSchema.index({ accountNumber: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);