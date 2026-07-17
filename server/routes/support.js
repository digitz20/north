const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  addMessage,
  closeTicket
} = require('../controllers/supportController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/tickets')
  .get(protect, getTickets)
  .post(protect, createTicket);

router.route('/tickets/:id')
  .get(protect, getTicket)
  .put(protect, updateTicket);

router.route('/tickets/:id/messages')
  .post(protect, addMessage);

router.route('/tickets/:id/close')
  .put(protect, closeTicket);

// Admin/support agent routes
router.route('/admin/tickets')
  .get(protect, authorize('admin', 'super-admin', 'support'), require('../controllers/supportController').getAllTickets);

router.route('/admin/tickets/:id/assign')
  .put(protect, authorize('admin', 'super-admin', 'support'), require('../controllers/supportController').assignTicket);

module.exports = router;