const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { initializeSocket } = require('./sockets/socketServer');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Connect to database and start server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`API available at http://0.0.0.0:${PORT}`);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  server.close(() => process.exit(1));
});

startServer();