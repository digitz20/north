const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  bankName: {
    type: String,
    default: 'NorthCrest Bank of USA'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  maxTransferAmount: {
    type: Number,
    default: 10000
  },
  minLoanAmount: {
    type: Number,
    default: 500
  },
  interestRate: {
    type: Number,
    default: 4.5
  },
  supportEmail: {
    type: String,
    default: 'support@northcrestbank.com'
  },
  supportPhone: {
    type: String,
    default: '+1-800-555-0123'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
