const express = require('express');
const router = express.Router();
const { protect, authorize, canAccessBusiness } = require('../middleware/auth');
const {
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  getStaffActivity
} = require('../controllers/staff.controller');

router.use(protect);
router.use(canAccessBusiness);

router.get('/', authorize('owner', 'manager'), getStaff);
router.post('/', authorize('owner', 'manager'), addStaff);
router.put('/:staffId', authorize('owner', 'manager'), updateStaff);
router.delete('/:staffId', authorize('owner'), deleteStaff);
router.get('/:staffId/activity', authorize('owner', 'manager'), getStaffActivity);

module.exports = router;