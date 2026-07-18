const mongoose = require('mongoose');

const loanProductSchema = new mongoose.Schema({
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
    enum: ['personal', 'mortgage', 'auto', 'student', 'business', 'home-equity'],
    required: true
  },
  minimumAmount: {
    type: Number,
    required: true,
    min: 0
  },
  maximumAmount: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  minTerm: {
    type: Number, // months
    required: true
  },
  maxTerm: {
    type: Number, // months
    required: true
  },
  originationFee: {
    type: Number,
    default: 0,
    description: 'Percentage of loan amount charged as fee'
  },
  creditScoreRequired: {
    type: Number,
    min: 300,
    max: 850
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: [String],
  documents: [String]
}, {
  timestamps: true
});

const userLoanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loanProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanProduct',
    required: true
  },
  loanId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'LN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true
  },
  term: {
    type: Number, // months
    required: true
  },
  monthlyPayment: {
    type: Number,
    required: true
  },
  totalInterest: {
    type: Number,
    required: true
  },
  originationFee: {
    type: Number,
    default: 0
  },
  disbursementDate: Date,
  firstPaymentDate: Date,
  lastPaymentDate: Date,
  remainingBalance: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'paid-off', 'defaulted', 'cancelled'],
    default: 'pending'
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  disbursementAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  payments: [{
    amount: Number,
    date: Date,
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'late'],
      default: 'pending'
    },
    lateFee: Number
  }],
  nextPaymentDate: Date,
  creditScoreAtApplication: Number,
  documents: [{
    type: String,
    url: String,
    name: String,
    uploadedAt: Date
  }],
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  autoPayEnabled: {
    type: Boolean,
    default: false
  },
  autoPayAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }
}, {
  timestamps: true
});

const taxRefundSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  ssn: {
    type: String,
    required: true,
    trim: true,
    maxlength: 11 // XXX-XX-XXXX format
  },
  idmeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  idmePassword: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  requestId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TR' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'approved', 'rejected', 'completed'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now()
    }
  }],
  refundAmount: Number,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  documents: [{
    type: String,
    name: String,
    url: String,
    documentCategory: {
      type: String,
      enum: ['irs-form', 'passport', 'id-front', 'id-back', 'other', 'tax-document'],
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now()
    }
  }]
}, {
  timestamps: true
});

// Calculate monthly payment before saving
userLoanSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate monthly payment using amortization formula
    const principal = this.amount;
    const monthlyRate = this.interestRate / 100 / 12;
    const numberOfPayments = this.term;
    
    if (monthlyRate === 0) {
      this.monthlyPayment = principal / numberOfPayments;
    } else {
      this.monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    this.totalInterest = (this.monthlyPayment * numberOfPayments) - principal;
    this.remainingBalance = this.amount;
    this.originationFee = this.amount * (this.loanProduct?.originationFee || 0) / 100;
  }
  next();
});

// Indexes
userLoanSchema.index({ user: 1, status: 1 });
userLoanSchema.index({ loanId: 1 }, { unique: true });
userLoanSchema.index({ nextPaymentDate: 1 });

module.exports = {
  LoanProduct: mongoose.model('LoanProduct', loanProductSchema),
  UserLoan: mongoose.model('UserLoan', userLoanSchema),
  TaxRefund: mongoose.model('TaxRefund', taxRefundSchema)
};