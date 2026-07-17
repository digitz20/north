const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  targetCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0.000001
  },
  bidRate: {
    type: Number, // Buy rate
    required: true
  },
  askRate: {
    type: Number, // Sell rate
    required: true
  },
  spread: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['manual', 'open-exchange-rates', 'alphavantage', 'coinbase', 'binance', 'other'],
    default: 'manual'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  historicalRate: {
    type: Boolean,
    default: false
  },
  volume24h: Number,
  high24h: Number,
  low24h: Number,
  change24h: Number,
  changePercent24h: Number
}, {
  timestamps: true
});

// Compound index for currency pairs
exchangeRateSchema.index({ 
  baseCurrency: 1, 
  targetCurrency: 1, 
  validFrom: -1 
});

exchangeRateSchema.index({ isValid: 1, validFrom: 1, validUntil: 1 });

// Calculate spread before saving
exchangeRateSchema.pre('save', function(next) {
  if (this.isModified('bidRate') || this.isModified('askRate')) {
    this.spread = this.askRate - this.bidRate;
    this.rate = (this.bidRate + this.askRate) / 2;
  }
  
  // Set default validity (1 hour from now for current rates)
  if (!this.validUntil && !this.historicalRate) {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 1);
    this.validUntil = validUntil;
  }
  
  next();
});

// Static method to get current exchange rate
exchangeRateSchema.statics.getCurrentRate = async function(base, target) {
  return this.findOne({
    baseCurrency: base.toUpperCase(),
    targetCurrency: target.toUpperCase(),
    isValid: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gt: new Date() }
  }).sort({ lastUpdated: -1 });
};

// Static method to convert amount
exchangeRateSchema.statics.convert = async function(amount, fromCurrency, toCurrency) {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return { amount, rate: 1 };
  }

  const rate = await this.getCurrentRate(fromCurrency, toCurrency);
  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  const convertedAmount = amount * rate.rate;
  return {
    originalAmount: amount,
    fromCurrency: fromCurrency.toUpperCase(),
    toCurrency: toCurrency.toUpperCase(),
    rate: rate.rate,
    convertedAmount,
    fee: amount * 0.01, // Example fee calculation
    exchangeRateId: rate._id
  };
};

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);