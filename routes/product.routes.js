const express = require('express');
const router = express.Router();
const { protect, authorize, canAccessBusiness } = require('../middleware/auth');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../controllers/product.controller');

router.use(protect);
router.use(canAccessBusiness); // Ensure user can only access their business

router.post('/', authorize('owner', 'manager', 'inventory_manager'), createProduct);
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);
router.put('/:id', authorize('owner', 'manager', 'inventory_manager'), updateProduct);
router.delete('/:id', authorize('owner'), deleteProduct);

module.exports = router;