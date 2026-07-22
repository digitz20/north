const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  addMessage,
  closeTicket,
  editMessage,
  deleteMessage
} = require('../controllers/supportController');
const { protect, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/support');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp3|wav|ogg|webm|mp4|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload attachment for support ticket
router.post('/tickets/:id/upload', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/support/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      data: {
        name: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

// Private user routes
router.route('/tickets')
  .get(protect, getTickets)
  .post(protect, createTicket);

router.route('/tickets/:id')
  .get(protect, getTicket)
  .put(protect, updateTicket);

router.route('/tickets/:id/messages')
  .post(protect, addMessage);

router.route('/tickets/:id/messages/:messageId')
  .put(protect, editMessage)
  .delete(protect, deleteMessage);

router.route('/tickets/:id/close')
  .put(protect, closeTicket);

// Admin/support agent routes
router.route('/admin/tickets')
  .get(protect, authorize('admin', 'super-admin', 'support'), require('../controllers/supportController').getAllTickets);

router.route('/admin/tickets/:id/assign')
  .put(protect, authorize('admin', 'super-admin', 'support'), require('../controllers/supportController').assignTicket);

module.exports = router;
