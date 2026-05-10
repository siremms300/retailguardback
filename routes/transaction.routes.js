const express = require('express');
const router = express.Router();
const { protect, authorize, canAccessBusiness } = require('../middleware/auth');
const {
  createTransaction,
  getTransaction,
  voidTransaction,
  getDailyTransactions
} = require('../controllers/transaction.controller');

router.use(protect);
router.use(canAccessBusiness);

router.post('/', authorize('cashier', 'manager', 'owner'), createTransaction);
router.get('/daily', getDailyTransactions);
router.get('/:id', getTransaction);
router.put('/:id/void', authorize('manager', 'owner'), voidTransaction);

module.exports = router;