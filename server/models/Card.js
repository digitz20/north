const mongoose = require('mongoose');
const crypto = require('crypto');

const cardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  cardId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'CRD' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  cardNumber: {
    type: String,
    required: true,
    select: false // Only return last 4 digits in responses
  },
  cardNumberHash: {
    type: String,
    required: true,
    unique: true
  },
  cardType: {
    type: String,
    enum: ['debit', 'credit', 'prepaid'],
    required: true
  },
  cardNetwork: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover'],
    required: true
  },
  cardholderName: {
    type: String,
    required: true,
    trim: true
  },
  expiryMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  expiryYear: {
    type: Number,
    required: true
  },
  cvv: {
    type: String,
    select: false // Never send CVV in responses
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  creditLimit: {
    type: Number, // For credit cards
    min: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockReason: String,
  lockedAt: Date,
  issuedAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: Date,
  dailySpendingLimit: {
    type: Number,
    default: 3000
  },
  spentToday: {
    type: Number,
    default: 0
  },
  lastSpendingReset: {
    type: Date,
    default: Date.now
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  internationalTransactionsEnabled: {
    type: Boolean,
    default: false
  },
  onlineTransactionsEnabled: {
    type: Boolean,
    default: true
  },
  contactlessEnabled: {
    type: Boolean,
    default: true
  },
  cardDesign: {
    type: String,
    default: 'default'
  },
  nickName: String
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.cardNumber && typeof ret.cardNumber.slice === 'function') {
        ret.lastFourDigits = ret.cardNumber.slice(-4);
        delete ret.cardNumber;
      }
      delete ret.cvv;
      delete ret.cardNumberHash;
      return ret;
    }
  }
});

// Generate card number and hash before saving
cardSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate a valid test card number (for development only)
    // In production, integrate with a payment processor
    const bin = '411111'; // Visa BIN
    const accountNumber = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
    this.cardNumber = bin + accountNumber;
    
    // Hash card number for storage
    this.cardNumberHash = crypto
      .createHash('sha256')
      .update(this.cardNumber)
      .digest('hex');
    
    // Generate CVV
    this.cvv = Math.floor(100 + Math.random() * 900).toString();
    
    // Set expiry (3 years from issue)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 3);
    this.expiryMonth = expiry.getMonth() + 1;
    this.expiryYear = expiry.getFullYear();
  }
  next();
});

// Virtual for formatted expiry date
cardSchema.virtual('formattedExpiry').get(function() {
  return `${this.expiryMonth.toString().padStart(2, '0')}/${this.expiryYear.toString().slice(-2)}`;
});

// Virtual for masked card number
cardSchema.virtual('maskedCardNumber').get(function() {
  if (!this.cardNumber) return '****-****-****-****';
  return `****-****-****-${this.cardNumber.slice(-4)}`;
});

// Indexes
cardSchema.index({ user: 1, isActive: 1 });
cardSchema.index({ cardId: 1 }, { unique: true });

module.exports = mongoose.model('Card', cardSchema);