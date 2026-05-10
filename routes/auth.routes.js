const express = require('express');
const router = express.Router();
const { 
  registerBusiness, 
  login, 
  adminLogin, 
  getMe 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Business routes
router.post('/register', registerBusiness);
router.post('/login', login);

// Platform admin route
router.post('/admin/login', adminLogin);

// Protected route
router.get('/me', protect, getMe);

module.exports = router;