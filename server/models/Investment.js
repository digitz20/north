const mongoose = require('mongoose');

const investmentPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['savings-bond', 'cd', 'mutual-fund', 'stock', 'etf', 'crypto', 'retirement'],
    required: true
  },
  minimumInvestment: {
    type: Number,
    required: true,
    min: 0
  },
  expectedReturn: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very-high'],
    required: true
  },
  duration: {
    type: Number, // in months
    min: 0
  },
  liquidity: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'maturity-only'],
    default: 'maturity-only'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: String,
  totalInvested: {
    type: Number,
    default: 0
  },
  maxInvestment: Number
}, {
  timestamps: true
});

const userInvestmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentPlan',
    required: true
  },
  investmentId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'INV' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  amountInvested: {
    type: Number,
    required: true,
    min: [0.01, 'Investment must be greater than 0']
  },
  currentValue: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'sold', 'pending'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  maturityDate: Date,
  soldDate: Date,
  returnsEarned: {
    type: Number,
    default: 0
  },
  lastValuationUpdate: {
    type: Date,
    default: Date.now
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  isAutoReinvest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Set maturity date before saving
userInvestmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const plan = await mongoose.model('InvestmentPlan').findById(this.plan);
    if (plan && plan.duration) {
      const maturity = new Date(this.purchaseDate);
      maturity.setMonth(maturity.getMonth() + plan.duration);
      this.maturityDate = maturity;
    }
    this.currentValue = this.amountInvested;
  }
  next();
});

// Indexes
userInvestmentSchema.index({ user: 1, status: 1 });
userInvestmentSchema.index({ investmentId: 1 }, { unique: true });

module.exports = {
  InvestmentPlan: mongoose.model('InvestmentPlan', investmentPlanSchema),
  UserInvestment: mongoose.model('UserInvestment', userInvestmentSchema)
};