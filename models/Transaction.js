const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  transactionNumber: {
    type: String,
    unique: true,
    required: true
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    name: String,
    phone: String,
    email: String,
    isRegistered: { type: Boolean, default: false }
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    sku: String,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    totalPrice: Number,
    costPriceAtSale: Number
  }],
  subtotal: { type: Number, required: true },
  discount: {
    amount: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'fixed'] },
    reason: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  tax: {
    amount: Number,
    rate: Number,
    type: String
  },
  total: { type: Number, required: true },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'mobile_money', 'mixed'],
      required: true
    },
    details: [{
      type: String,
      amount: Number,
      reference: String,
      status: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
      verifiedAt: Date
    }],
    status: { type: String, enum: ['paid', 'partial', 'pending', 'refunded'], default: 'pending' }
  },
  receipt: {
    receiptNumber: { type: String, unique: true },
    qrCode: String,
    deliveredVia: [String],
    isPrinted: { type: Boolean, default: false },
    isDigitallySent: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['completed', 'voided', 'refunded', 'pending'],
    default: 'completed'
  },
  voidReason: String,
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voidedAt: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

transactionSchema.index({ businessId: 1, createdAt: -1 });
transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);