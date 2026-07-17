const express = require('express');
const router = express.Router();
const {
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  activateCard,
  freezeCard,
  unfreezeCard
} = require('../controllers/cardController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getCards)
  .post(protect, createCard);

router.route('/:id')
  .get(protect, getCard)
  .put(protect, updateCard)
  .delete(protect, deleteCard);

router.route('/:id/activate')
  .put(protect, activateCard);

router.route('/:id/freeze')
  .put(protect, freezeCard);

router.route('/:id/unfreeze')
  .put(protect, unfreezeCard);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/cardController').getAllCards);

module.exports = router;