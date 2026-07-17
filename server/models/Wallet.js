const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  monthlyDepositLimit: {
    type: Number,
    default: 10000
  },
  depositsThisMonth: {
    type: Number,
    default: 0
  },
  lastMonthReset: {
    type: Date,
    default: Date.now
  },
  walletId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'WC' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to reset monthly deposits if new month
walletSchema.pre('save', function(next) {
  const now = new Date();
  const lastReset = new Date(this.lastMonthReset);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.depositsThisMonth = 0;
    this.lastMonthReset = now;
  }
  next();
});

module.exports = mongoose.model('Wallet', walletSchema);