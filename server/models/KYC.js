const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  kycId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'KYC' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  status: {
    type: String,
    enum: ['not-submitted', 'pending', 'in-review', 'approved', 'rejected', 'additional-info-needed'],
    default: 'not-submitted'
  },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  type: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  documents: {
    idDocument: {
      type: {
        type: String,
        enum: ['passport', 'driver-license', 'state-id', 'social-security']
      },
      documentNumber: String,
      frontImageUrl: String,
      backImageUrl: String,
      verifiedAt: Date
    },
    proofOfAddress: {
      type: {
        type: String,
        enum: ['utility-bill', 'bank-statement', 'lease-agreement']
      },
      documentUrl: String,
      issueDate: Date,
      verifiedAt: Date
    },
    selfieImage: {
      imageUrl: String,
      verifiedAt: Date
    },
    additionalDocuments: [{
      name: String,
      documentUrl: String,
      uploadedAt: Date
    }]
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    nationality: String,
    ssn: {
      type: String,
      select: false
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: String,
    email: String
  },
  employment: {
    status: String,
    employer: String,
    occupation: String,
    annualIncome: {
      amount: Number,
      currency: { type: String, default: 'USD' }
    },
    sourceOfFunds: [String]
  },
  businessInfo: {
    legalName: String,
    businessType: String,
    ein: String,
    incorporationDate: Date,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  verificationDetails: {
    overallScore: Number,
    idMatchScore: Number,
    addressMatchScore: Number,
    faceMatchScore: Number,
    notes: String,
    checks: [{
      type: String,
      status: String,
      performedAt: Date,
      provider: String
    }]
  },
  riskAssessment: {
    score: Number,
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    factors: [String],
    lastAssessment: Date
  },
  history: [{
    status: String,
    comment: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: Date,
  level: {
    type: Number,
    enum: [1, 2, 3], // KYC levels - 1: basic, 2: verified, 3: enhanced
    default: 1
  },
  annualTransactionLimit: {
    type: Number,
    default: 10000
  }
}, {
  timestamps: true
});

// Indexes
kycSchema.index({ user: 1 }, { unique: true });
kycSchema.index({ status: 1, submittedAt: -1 });
kycSchema.index({ kycId: 1 }, { unique: true });

// Auto set expiration date
kycSchema.pre('save', function(next) {
  if (this.status === 'approved' && !this.expiresAt) {
    // KYC expires after 2 years
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);
    this.expiresAt = expiry;
  }
  next();
});

module.exports = mongoose.model('KYC', kycSchema);