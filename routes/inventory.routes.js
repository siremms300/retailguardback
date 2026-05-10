const express = require('express');
const router = express.Router();
const { protect, authorize, canAccessBusiness } = require('../middleware/auth');
const {
  getInventory,
  updateStock,
  getLowStockAlerts,
  stockAdjustment
} = require('../controllers/inventory.controller');

router.use(protect);
router.use(canAccessBusiness);

router.get('/', getInventory);
router.get('/low-stock', getLowStockAlerts);
router.put('/:productId/stock', authorize('inventory_manager', 'manager', 'owner'), updateStock);
router.post('/adjustment', authorize('inventory_manager', 'manager', 'owner'), stockAdjustment);

module.exports = router;