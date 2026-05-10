const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBusiness,
  updateBusiness,
  createBranch,
  updateBranch,
  getBranches
} = require('../controllers/business.controller');

router.get('/', protect, getBusiness);
router.put('/', protect, authorize('owner'), updateBusiness);
router.get('/branches', protect, getBranches);
router.post('/branches', protect, authorize('owner', 'manager'), createBranch);
router.put('/branches/:branchId', protect, authorize('owner', 'manager'), updateBranch);

module.exports = router;