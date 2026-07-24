const SupportTicket = require('../models/SupportTicket');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendToTicket } = require('../sockets/socketServer');

// @desc    Get all user support tickets
// @route   GET /api/v1/support/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    // Build query
    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_tickets_viewed',
      category: 'support',
      description: `User viewed their support tickets (page ${page})`,
      entity: { type: 'other', id: null, name: 'Support Tickets' },
      metadata: { total, page, limit, status }
    });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single support ticket
// @route   GET /api/v1/support/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Verify ownership - only ticket owner or admin/support can access
    if (ticket.user._id.toString() !== req.user.id && 
        !['admin', 'super-admin', 'support'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ticket'
      });
    }

    // Mark all messages as read by current user
    ticket.messages.forEach(message => {
      if (!message.readBy.some(read => read.user.toString() === req.user.id)) {
        message.readBy.push({ user: req.user.id });
      }
    });
    await ticket.save();

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_ticket_viewed',
      category: 'support',
      description: `User viewed support ticket: ${ticket.ticketId}`,
      entity: { type: 'other', id: ticket._id, name: ticket.ticketId }
    });

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new support ticket
// @route   POST /api/v1/support/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      subject,
      description,
      category,
      priority,
      attachments,
      relatedEntity
    } = req.body;

    // Validate required fields
    if (!subject || !description || !category) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, description, and category'
      });
    }

    // Check if user already has an open ticket
    const existingTicket = await SupportTicket.findOne({
      user: req.user.id,
      status: { $nin: ['closed', 'resolved'] }
    }).session(session);

    if (existingTicket) {
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: 'Existing ticket found',
        data: existingTicket
      });
    }

    // Create ticket data
    const ticketData = {
      user: req.user.id,
      subject,
      description,
      category,
      priority: priority || 'medium',
      attachments: attachments || []
    };

    // Add related entity if provided
    if (relatedEntity && relatedEntity.type && relatedEntity.id) {
      ticketData.relatedEntity = relatedEntity;
    }

    // Create ticket
    const ticket = await SupportTicket.create([ticketData], { session });

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_ticket_created',
      category: 'support',
      description: `User created new support ticket: ${ticket[0].ticketId}`,
      entity: { type: 'other', id: ticket[0]._id, name: ticket[0].ticketId },
      metadata: { category, priority: ticketData.priority }
    });

    // Create notification for support team (in a real app, this would notify all support users)
    // For now, we'll create a notification that can be fetched by admins
    await Notification.create({
      user: req.user.id, // In production, this would go to support users
      type: 'support',
      title: 'New Support Ticket Created',
      message: `A new support ticket has been created: ${subject}`,
      relatedModel: 'SupportTicket',
      relatedId: ticket[0]._id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Update support ticket
// @route   PUT /api/v1/support/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { subject, description, category, priority, tags } = req.body;

    // Find ticket
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
    });
    }

    // Verify ownership - only ticket owner can update
    if (ticket.user.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }

    // Can only update open or in-progress tickets
    if (!['open', 'in-progress', 'awaiting-user'].includes(ticket.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot update ticket with status: ${ticket.status}`
      });
    }

    // Update fields
    const before = { ...ticket._doc };
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (tags) ticket.tags = tags;

    await ticket.save({ session });

    const after = { ...ticket._doc };

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_ticket_updated',
      category: 'support',
      description: `User updated support ticket: ${ticket.ticketId}`,
      entity: { type: 'other', id: ticket._id, name: ticket.ticketId },
      before,
      after
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Add message to support ticket
// @route   POST /api/v1/support/tickets/:id/messages
// @access  Private
exports.addMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { message, attachments, isInternal = false } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide a message or attachment'
      });
    }

    // Find ticket
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Verify access
    const isOwner = ticket.user.toString() === req.user.id;
    const isAgent = ['admin', 'super-admin', 'support'].includes(req.user.role);
    if (!isOwner && !isAgent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add messages to this ticket'
      });
    }

    // Only agents can send internal messages
    if (isInternal && !isAgent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Only support agents can send internal messages'
      });
    }

    // If ticket was awaiting user and user responds, change status back to in-progress
    if (isOwner && ticket.status === 'awaiting-user') {
      ticket.status = 'in-progress';
    }

    // Add message to ticket
    await ticket.addMessage(req.user.id, message, isInternal, attachments || []);

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_message_added',
      category: 'support',
      description: `${isAgent ? 'Agent' : 'User'} added message to ticket: ${ticket.ticketId}`,
      entity: { type: 'other', id: ticket._id, name: ticket.ticketId },
      metadata: { isInternal }
    });

    // Notify the other party (user if agent replied, agent if user replied)
    const notifyUserId = isAgent ? ticket.user : ticket.assignedTo;
    if (notifyUserId) {
      await Notification.create({
        user: notifyUserId,
        type: 'support',
        title: 'New Message on Support Ticket',
        message: `A new message has been added to ticket ${ticket.ticketId}`,
        relatedModel: 'SupportTicket',
        relatedId: ticket._id
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: ticket.messages[ticket.messages.length - 1]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Close support ticket
// @route   PUT /api/v1/support/tickets/:id/close
// @access  Private
exports.closeTicket = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Find ticket
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Verify ownership or agent access
    const isOwner = ticket.user.toString() === req.user.id;
    const isAgent = ['admin', 'super-admin', 'support'].includes(req.user.role);
    if (!isOwner && !isAgent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to close this ticket'
      });
    }

    // Check if already closed
    if (ticket.status === 'closed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Ticket is already closed'
      });
    }

    // Use the model's close method
    await ticket.close(req.user.id);

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_ticket_closed',
      category: 'support',
      description: `${isAgent ? 'Agent' : 'User'} closed ticket: ${ticket.ticketId}`,
      entity: { type: 'other', id: ticket._id, name: ticket.ticketId }
    });

    // Notify the other party
    const notifyUserId = isAgent ? ticket.user : ticket.assignedTo;
    if (notifyUserId) {
      await Notification.create({
        user: notifyUserId,
        type: 'support',
        title: 'Support Ticket Closed',
        message: `Ticket ${ticket.ticketId} has been closed`,
        relatedModel: 'SupportTicket',
        relatedId: ticket._id
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Support ticket closed successfully',
      data: ticket
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all support tickets (admin/support only)
// @route   GET /api/v1/support/admin/tickets
// @access  Private/Admin
exports.getAllTickets = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Filters
    const status = req.query.status;
    const category = req.query.category;
    const priority = req.query.priority;
    const assignedTo = req.query.assignedTo;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo === 'unassigned') {
      query.assignedTo = null;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'all_support_tickets_viewed',
      category: 'support',
      description: `Support agent viewed all tickets (page ${page})`,
      entity: { type: 'other', id: null, name: 'All Support Tickets' },
      metadata: { total, page, limit, filters: { status, category, priority, assignedTo } }
    });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign support ticket (admin/support only)
// @route   PUT /api/v1/support/admin/tickets/:id/assign
// @access  Private/Admin
exports.assignTicket = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { agentId } = req.body;

    if (!agentId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide an agent ID to assign'
      });
    }

    // Verify agent exists and has correct role
    const agent = await User.findById(agentId);
    if (!agent || !['admin', 'super-admin', 'support'].includes(agent.role)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID'
      });
    }

    // Find ticket
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check if already assigned to this agent
    if (ticket.assignedTo && ticket.assignedTo.toString() === agentId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Ticket is already assigned to this agent'
      });
    }

    const before = { assignedTo: ticket.assignedTo, status: ticket.status };
    
    // Update ticket assignment
    ticket.assignedTo = agentId;
    ticket.assignedAt = new Date();
    ticket.status = 'in-progress';
    
    // Add to escalation history if it was previously assigned
    if (ticket.assignedTo) {
      ticket.escalationHistory.push({
        escalatedFrom: before.assignedTo,
        escalatedTo: agentId,
        reason: 'Ticket reassigned',
        escalatedAt: new Date()
      });
    }

    await ticket.save({ session });

    const after = { assignedTo: ticket.assignedTo, status: ticket.status };

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_ticket_assigned',
      category: 'support',
      description: `Agent assigned ticket ${ticket.ticketId} to ${agent.firstName} ${agent.lastName}`,
      entity: { type: 'other', id: ticket._id, name: ticket.ticketId },
      before,
      after
    });

    // Notify the assigned agent
    await Notification.create({
      user: agentId,
      type: 'support',
      title: 'New Ticket Assigned',
      message: `A new support ticket has been assigned to you: ${ticket.subject}`,
      relatedModel: 'SupportTicket',
      relatedId: ticket._id
    });

    // Notify the ticket owner
    await Notification.create({
      user: ticket.user,
      type: 'support',
      title: 'Ticket Assigned to Agent',
      message: `Your support ticket ${ticket.ticketId} has been assigned to an agent and is being reviewed.`,
      relatedModel: 'SupportTicket',
      relatedId: ticket._id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete support ticket (admin/support only)
// @route   DELETE /api/v1/support/admin/tickets/:id
// @access  Private/Admin
exports.deleteTicket = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticket = await SupportTicket.findById(req.params.id).session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const isAgent = ['admin', 'super-admin', 'support'].includes(req.user.role);
    if (!isAgent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ticket'
      });
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: req.user.role, ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'support_ticket_deleted',
      category: 'support',
      description: `Agent deleted ticket: ${ticket.ticketId}`,
      entity: { type: 'other', id: ticket._id, name: ticket.ticketId }
    });

    await SupportTicket.deleteOne({ _id: ticket._id }).session(session);
    await session.commitTransaction();
    session.endSession();

    const deletedTicketId = ticket._id.toString();
    sendToTicket(deletedTicketId, 'ticketDeleted', { ticketId: deletedTicketId });

    res.status(200).json({
      success: true,
      message: 'Support ticket deleted successfully',
      ticketId: ticket.ticketId
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Edit a support ticket message
// @route   PUT /api/v1/support/tickets/:id/messages/:messageId
// @access  Private
exports.editMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { message } = req.body;
    const { id: ticketId, messageId } = req.params;

    if (!message || message.trim().length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const ticket = await SupportTicket.findById(ticketId).session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Edit message:', {
        messageId,
        ticketMessageIds: ticket.messages.map(m => m._id.toString()),
        messageCount: ticket.messages.length
      });
    }
    const targetMessage = ticket.messages.find(
      m => m._id.toString() === messageId.toString()
    );
    if (!targetMessage) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isAdmin = ['admin', 'super-admin', 'support'].includes(req.user.role);
    const isSender = targetMessage.sender.toString() === req.user.id;
    if (!isAdmin && !isSender) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    targetMessage.message = message.trim();
    targetMessage.edited = true;
    targetMessage.editedAt = new Date();

    await ticket.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: targetMessage });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete a support ticket message
// @route   DELETE /api/v1/support/tickets/:id/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id: ticketId, messageId } = req.params;

    const ticket = await SupportTicket.findById(ticketId).session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Delete message:', {
        messageId,
        ticketMessageIds: ticket.messages.map(m => m._id.toString()),
        messageCount: ticket.messages.length
      });
    }
    const targetMessage = ticket.messages.find(
      m => m._id.toString() === messageId.toString()
    );
    if (!targetMessage) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isAdmin = ['admin', 'super-admin', 'support'].includes(req.user.role);
    const isSender = targetMessage.sender.toString() === req.user.id;
    if (!isAdmin && !isSender) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    ticket.messages = ticket.messages.filter(m => m._id.toString() !== messageId);
    await ticket.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};