const express = require('express');
const router = express.Router();
const { protect, canAccessBusiness } = require('../middleware/auth');
const {
  getDashboardStats,
  getSalesReport,
  getLeakageAnalysis
} = require('../controllers/analytics.controller');

router.use(protect);
router.use(canAccessBusiness);

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/leakage', getLeakageAnalysis);

module.exports = router;