const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
      methods: ['GET', 'POST'],
      credentials: true
    }
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
    logger.info(`User connected: ${socket.user.id}`);
    
    // Join user to their private room for personal notifications
    socket.join(`user:${socket.user.id}`);
    
    // If user is admin, join admin room
    if (socket.user.role === 'admin' || socket.user.role === 'super-admin') {
      socket.join('admin');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.id}`);
    });

    // Handle typing indicators (for support chat)
    socket.on('typing', (data) => {
      socket.to(`ticket:${data.ticketId}`).emit('user_typing', {
        userId: socket.user.id,
        ticketId: data.ticketId
      });
    });

    // Join a specific ticket room (for support chat)
    socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      logger.info(`User ${socket.user.id} joined ticket room: ${ticketId}`);
    });

    // Leave a ticket room
    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      logger.info(`User ${socket.user.id} left ticket room: ${ticketId}`);
    });
  });

  logger.info('Socket.IO server initialized');
};

// Send notification to specific user
const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
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
  sendToTicket,
  broadcast
};