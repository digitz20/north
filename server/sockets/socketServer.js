const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

let io;
const onlineAgents = new Map(); // Track online support agents: agentId -> socketId
const userConnections = new Map(); // Track user connections: userId -> socketId
const messageRateLimits = new Map(); // Track message rates to prevent spam: userId -> {count, lastReset}
const MAX_MESSAGES_PER_MINUTE = 30; // Rate limit: 30 messages per minute

// Simple XSS sanitization function to prevent script injection
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

// Check rate limit before allowing messages
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userLimit = messageRateLimits.get(userId);
  
  if (!userLimit) {
    messageRateLimits.set(userId, { count: 1, lastReset: now });
    return true;
  }
  
  // Reset counter if a minute has passed
  if (now - userLimit.lastReset > 60000) {
    messageRateLimits.set(userId, { count: 1, lastReset: now });
    return true;
  }
  
  if (userLimit.count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  
  userLimit.count++;
  messageRateLimits.set(userId, userLimit);
  return true;
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    },
    maxHttpBufferSize: 50e6,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.id} (role: ${socket.user.role})`);
    
    // Join user to their private room for personal notifications
    socket.join(`user:${socket.user.id}`);
    userConnections.set(socket.user.id, socket.id);
    
    // If user is support/admin, add to online agents
    if (['admin', 'super-admin', 'support'].includes(socket.user.role)) {
      socket.join('support-team');
      onlineAgents.set(socket.user.id, {
        socketId: socket.id,
        status: 'online',
        lastActive: new Date()
      });
      // Broadcast agent online status to all users
      broadcastAgentStatus();
    }

    // ============================================
    // LIVE SUPPORT CHAT SOCKET EVENTS
    // ============================================

    // Join chat (ticket) room
    socket.on('joinChat', async (ticketId) => {
      try {
        socket.join(`ticket:${ticketId}`);
        logger.info(`User ${socket.user.id} joined chat room: ${ticketId}`);
        
        // If an agent joined, notify the customer
        if (['admin', 'super-admin', 'support'].includes(socket.user.role)) {
          const ticket = await SupportTicket.findById(ticketId).populate('user', '_id');
          if (ticket && ticket.user) {
            sendToUser(ticket.user._id.toString(), 'agentJoined', {
              ticketId,
              agent: { id: socket.user.id, name: socket.user.firstName + ' ' + socket.user.lastName }
            });
          }
        }
      } catch (error) {
        logger.error(`Error joining chat: ${error.message}`);
      }
    });

    // Leave chat room
    socket.on('leaveChat', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      logger.info(`User ${socket.user.id} left chat room: ${ticketId}`);
      
      // If an agent left, notify the customer
      if (['admin', 'super-admin', 'support'].includes(socket.user.role)) {
        sendToTicket(ticketId, 'agentLeft', { ticketId, agentId: socket.user.id });
      }
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      try {
        const { ticketId, message, attachments = [] } = data;
        const senderId = socket.user.id;

        // Check rate limit to prevent spam
        if (!checkRateLimit(senderId)) {
          socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
          return;
        }

        // Sanitize input to prevent XSS attacks
        const sanitizedMessage = sanitizeInput(message);
        const sanitizedTicketId = sanitizeInput(ticketId);

        if ((!sanitizedMessage || sanitizedMessage.length === 0) && (!attachments || attachments.length === 0)) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Enforce message length limit
        if (sanitizedMessage.length > 1000) {
          socket.emit('error', { message: 'Message is too long. Maximum 1000 characters.' });
          return;
        }
        
        // Find the ticket
        const ticket = await SupportTicket.findById(sanitizedTicketId);
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }

        // Add message to ticket
        const newMessage = await ticket.addMessage(socket.user.id, sanitizedMessage, false, attachments);
        await ticket.save();
        
        // Populate sender details
        await ticket.populate('messages.sender', 'firstName lastName email role');
        const savedMessage = ticket.messages[ticket.messages.length - 1];

        // Broadcast message to everyone in the ticket room
        sendToTicket(ticketId, 'receiveMessage', {
          ticketId,
          message: savedMessage,
          tempId: data.tempId
        });

        // Mark message as delivered (also deliver to sender)
        sendToTicket(ticketId, 'messageDelivered', {
          ticketId,
          messageId: newMessage._id,
          deliveredAt: new Date()
        });

        logger.info(`Message sent to ticket ${ticketId} by user ${socket.user.id}`);
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { ticketId } = data;
      socket.to(`ticket:${ticketId}`).emit('typing', {
        userId: socket.user.id,
        ticketId,
        isAgent: ['admin', 'super-admin', 'support'].includes(socket.user.role)
      });
    });

    // Stop typing indicator
    socket.on('stopTyping', (data) => {
      const { ticketId } = data;
      socket.to(`ticket:${ticketId}`).emit('stopTyping', {
        userId: socket.user.id,
        ticketId
      });
    });

    // Mark message as read
    socket.on('messageRead', async (data) => {
      try {
        const { ticketId, messageId } = data;
        const ticket = await SupportTicket.findById(ticketId);
        
        if (ticket) {
          // Find the message and mark as read by current user
          const message = ticket.messages.id(messageId);
          if (message && !message.readBy.some(read => read.user.toString() === socket.user.id)) {
            message.readBy.push({ user: socket.user.id, readAt: new Date() });
            await ticket.save();
            
            // Broadcast read receipt to everyone in the ticket room
            sendToTicket(ticketId, 'messageRead', {
              ticketId,
              messageId,
              readBy: { user: socket.user.id, readAt: new Date() }
            });
          }
        }
      } catch (error) {
        logger.error(`Error marking message as read: ${error.message}`);
      }
    });

    // Delete message
    socket.on('deleteMessage', async (data) => {
      try {
        const { ticketId, messageId } = data;
        const ticket = await SupportTicket.findById(ticketId);
        
        if (ticket) {
          const exists = ticket.messages.some(m => m._id.toString() === messageId);
          if (exists) {
            ticket.messages = ticket.messages.filter(m => m._id.toString() !== messageId);
            await ticket.save();
            
            // Broadcast deletion to everyone in the ticket room
            sendToTicket(ticketId, 'messageDeleted', {
              ticketId,
              messageId
            });
          }
        }
      } catch (error) {
        logger.error(`Error deleting message: ${error.message}`);
      }
    });

    // Update message
    socket.on('updateMessage', async (data) => {
      try {
        const { ticketId, messageId, message: newMessageText } = data;
        const ticket = await SupportTicket.findById(ticketId);
        
        if (ticket) {
          const message = ticket.messages.id(messageId);
          if (message) {
            message.message = newMessageText;
            message.edited = true;
            message.editedAt = new Date();
            await ticket.save();
            
            // Broadcast update to everyone in the ticket room
            sendToTicket(ticketId, 'messageUpdated', {
              ticketId,
              messageId,
              message: newMessageText,
              edited: true,
              editedAt: new Date()
            });
          }
        }
      } catch (error) {
        logger.error(`Error updating message: ${error.message}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.id}`);
      userConnections.delete(socket.user.id);
      
      // If user was an agent, remove from online agents
      if (onlineAgents.has(socket.user.id)) {
        onlineAgents.delete(socket.user.id);
        broadcastAgentStatus();
      }
    });

    // Handle reconnection
    socket.on('reconnect', () => {
      logger.info(`User reconnected: ${socket.user.id}`);
      userConnections.set(socket.user.id, socket.id);
      
      if (['admin', 'super-admin', 'support'].includes(socket.user.role)) {
        onlineAgents.set(socket.user.id, {
          socketId: socket.id,
          status: 'online',
          lastActive: new Date()
        });
        broadcastAgentStatus();
      }
    });
  });

  logger.info('Socket.IO server initialized with live support chat');
};

// Broadcast current agent online status to all users
const broadcastAgentStatus = () => {
  const hasOnlineAgents = onlineAgents.size > 0;
  if (io) {
    io.emit('supportStatus', { 
      online: hasOnlineAgents,
      agentCount: onlineAgents.size
    });
  }
};

// Get current online agent count
const getOnlineAgentCount = () => onlineAgents.size;

// Send notification to specific user
const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Send notification to all admins/support
const sendToSupportTeam = (event, data) => {
  if (io) {
    io.to('support-team').emit(event, data);
  }
};

// Send notification to all admins
const sendToAdmins = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

// Send message to ticket room (support chat)
const sendToTicket = (ticketId, event, data) => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit(event, data);
  }
};

// Broadcast to all connected clients
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  sendToUser,
  sendToAdmins,
  sendToSupportTeam,
  sendToTicket,
  broadcast,
  getOnlineAgentCount,
  broadcastAgentStatus
};

module.exports = {
  initializeSocket,
  sendToUser,
  sendToAdmins,
  sendToTicket,
  broadcast
};