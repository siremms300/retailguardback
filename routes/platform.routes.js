const express = require('express');
const router = express.Router();
const { protect, platformAdminOnly, superAdminOnly } = require('../middleware/auth');
const {
  getAllBusinesses,
  getBusinessDetails,
  suspendBusiness,
  activateBusiness,
  getAllUsers,
  getPlatformStats,
  getRecentTransactions,
  getSubscriptionPlans,
  updateSubscription,
  getActivityLogs,
  createPlatformAdmin
} = require('../controllers/platform.controller');

// All routes require platform admin authentication
router.use(protect, platformAdminOnly);

// Dashboard & Stats
router.get('/stats', getPlatformStats);
router.get('/transactions/recent', getRecentTransactions);
router.get('/activity', getActivityLogs);

// Business management
router.get('/businesses', getAllBusinesses);
router.get('/businesses/:businessId', getBusinessDetails);
router.put('/businesses/:businessId/suspend', suspendBusiness);
router.put('/businesses/:businessId/activate', activateBusiness);

// Subscription management
router.get('/subscriptions/plans', getSubscriptionPlans);
router.put('/subscriptions/:businessId', updateSubscription);

// User management
router.get('/users', getAllUsers);

// Admin management (super admin only)
router.post('/admins', superAdminOnly, createPlatformAdmin);

module.exports = router;