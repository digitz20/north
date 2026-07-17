const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 3
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  decimalPlaces: {
    type: Number,
    required: true,
    default: 2,
    min: 0,
    max: 6
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBaseCurrency: {
    type: Boolean,
    default: false
  },
  isCrypto: {
    type: Boolean,
    default: false
  },
  flags: {
    canDeposit: { type: Boolean, default: true },
    canWithdraw: { type: Boolean, default: true },
    canTransfer: { type: Boolean, default: true },
    canInvest: { type: Boolean, default: true }
  },
  withdrawalFee: {
    type: Number,
    default: 0,
    description: 'Percentage fee for withdrawals'
  },
  depositFee: {
    type: Number,
    default: 0,
    description: 'Percentage fee for deposits'
  },
  transferFee: {
    type: Number,
    default: 0,
    description: 'Percentage fee for transfers'
  },
  minimumBalance: {
    type: Number,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  icon: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Ensure only one base currency
currencySchema.pre('save', async function(next) {
  if (this.isBaseCurrency && this.isModified('isBaseCurrency')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isBaseCurrency: false }
    );
  }
  next();
});

// Format currency amount
currencySchema.methods.format = function(amount) {
  return `${this.symbol}${amount.toFixed(this.decimalPlaces)}`;
};

// Indexes
currencySchema.index({ code: 1 }, { unique: true });
currencySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Currency', currencySchema);