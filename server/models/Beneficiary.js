const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: String,
  nickname: {
    type: String,
    trim: true,
    maxlength: [30, 'Nickname cannot exceed 30 characters']
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  routingNumber: {
    type: String,
    trim: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  internalUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  internalAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  relationship: {
    type: String,
    enum: ['family', 'friend', 'business', 'other'],
    default: 'other'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['micro-deposit', 'instant', 'manual']
  },
  lastUsed: Date,
  transferCount: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate beneficiaries for the same user
beneficiarySchema.index({ 
  user: 1, 
  accountNumber: 1, 
  routingNumber: 1 
}, { 
  unique: true,
  message: 'A beneficiary with this account already exists'
});

module.exports = mongoose.model('Beneficiary', beneficiarySchema);