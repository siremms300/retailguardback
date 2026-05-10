const express = require('express');
const router = express.Router();
const { protect, authorize, canAccessBusiness } = require('../middleware/auth');
const {
  runReconciliation,
  getReconciliation,
  approveReconciliation
} = require('../controllers/reconciliation.controller');

router.use(protect);
router.use(canAccessBusiness);

router.post('/daily', authorize('manager', 'owner', 'accountant'), runReconciliation);
router.get('/:date', getReconciliation);
router.put('/:reconciliationId/approve', authorize('owner', 'accountant'), approveReconciliation);

module.exports = router;