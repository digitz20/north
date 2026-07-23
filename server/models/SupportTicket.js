const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TKT' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'account', 'transaction', 'transfer', 'card', 'loan',
      'investment', 'kyc', 'technical', 'security', 'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'awaiting-user', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [{
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isInternal: {
      type: Boolean,
      default: false
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedEntity: {
    type: {
      type: String,
      enum: ['transaction', 'transfer', 'account', 'card', 'loan', 'investment']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  resolution: {
    summary: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    userSatisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: String,
      submittedAt: Date
    }
  },
  closedAt: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalationHistory: [{
    escalatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    escalatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  firstResponseAt: Date,
  resolutionTime: Number, // in hours
  tags: [String]
}, {
  timestamps: true
});

// Add message to ticket
  supportTicketSchema.methods.addMessage = async function(senderId, message, isInternal = false, attachments = []) {
    this.messages.push({
      sender: senderId,
      message: message || (attachments.length > 0 ? '📎 Attachment' : ''),
      isInternal,
      attachments,
      createdAt: new Date()
    });
  
  // If this is the first agent response, set firstResponseAt
  if (!this.firstResponseAt && isInternal) {
    this.firstResponseAt = new Date();
  }
  
  return this.save();
};

// Resolve ticket
supportTicketSchema.methods.resolve = async function(resolverId, summary) {
  this.status = 'resolved';
  this.resolution = {
    summary,
    resolvedBy: resolverId,
    resolvedAt: new Date()
  };
  this.resolutionTime = (Date.now() - this.createdAt) / (1000 * 60 * 60); // hours
  return this.save();
};

// Close ticket
supportTicketSchema.methods.close = async function(closerId) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = closerId;
  return this.save();
};

// Indexes
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ ticketId: 1 }, { unique: true });
supportTicketSchema.index({ category: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);