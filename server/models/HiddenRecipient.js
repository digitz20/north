const mongoose = require('mongoose');

const hiddenRecipientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  bankName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  routingNumber: { type: String, required: true, trim: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  transferType: { type: String, enum: ['local', 'wire', 'bank'], required: true },
  note: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.models.HiddenRecipient || mongoose.model('HiddenRecipient', hiddenRecipientSchema);
