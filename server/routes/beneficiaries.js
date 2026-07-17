const express = require('express');
const router = express.Router();
const {
  getBeneficiaries,
  getBeneficiary,
  addBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  verifyBeneficiary
} = require('../controllers/beneficiaryController');
const { protect, authorize } = require('../middlewares/auth');

// Private user routes
router.route('/')
  .get(protect, getBeneficiaries)
  .post(protect, addBeneficiary);

router.route('/:id')
  .get(protect, getBeneficiary)
  .put(protect, updateBeneficiary)
  .delete(protect, deleteBeneficiary);

router.route('/:id/verify')
  .post(protect, verifyBeneficiary);

// Admin-only routes
router.route('/admin/all')
  .get(protect, authorize('admin', 'super-admin'), require('../controllers/beneficiaryController').getAllBeneficiaries);

module.exports = router;