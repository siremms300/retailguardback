const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  branchId: mongoose.Schema.Types.ObjectId,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['sale', 'purchase', 'return', 'adjustment', 'damage', 'theft', 'transfer'],
    required: true
  },
  quantityChange: { type: Number, required: true },
  quantityBefore: { type: Number, required: true },
  quantityAfter: { type: Number, required: true },
  reason: String,
  referenceId: String, // Transaction ID or Purchase Order ID
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

inventoryLogSchema.index({ businessId: 1, productId: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);