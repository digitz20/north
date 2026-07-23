// Load environment variables: dotenv only for local development, safe in production
if (typeof process.env.MONGODB_URI === 'undefined') {
  try {
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  } catch (err) {
    // dotenv not available in production, which is fine
  }
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const transferRoutes = require('./routes/transfers');
const walletRoutes = require('./routes/wallet');
const cardRoutes = require('./routes/cards');
const loanRoutes = require('./routes/loans');
const investmentRoutes = require('./routes/investments');
const notificationRoutes = require('./routes/notifications');
const beneficiaryRoutes = require('./routes/beneficiaries');
const kycRoutes = require('./routes/kyc');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');

const app = express();

// Security middleware
app.use(helmet());

// Ultimate CORS fix - allow everything for production deployment
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Explicitly handle all OPTIONS preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request parsing - MUST come before any middleware that reads req.body!
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from origin: ${req.get('Origin') || 'unknown'}`);
  console.log('Request body:', req.body);
  next();
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/investments', investmentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/beneficiaries', beneficiaryRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/support', supportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NorthCrest Bank API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Serve uploads with explicit CORS so Vercel-hosted frontends can load images/audio
app.use('/uploads', (req, res, next) => {
  const path = require('path');
  const fs = require('fs');
  const uploadsRoot = path.join(__dirname, 'uploads');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }

  if (req.method === 'GET') {
    const filePath = path.join(uploadsRoot, req.path);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return res.sendStatus(404);
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm',
      '.mp4': 'video/mp4', '.pdf': 'application/pdf',
      '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.header('Cache-Control', 'public, max-age=31536000');
    fs.createReadStream(filePath).pipe(res);
  } else {
    next();
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

module.exports = app;