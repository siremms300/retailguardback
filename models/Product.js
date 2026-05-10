const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: String,
  category: {
    type: String,
    required: true
  },
  subCategory: String,
  brand: String,
  unitType: {
    type: String,
    enum: ['unit', 'dozen', 'carton', 'kg', 'litre', 'meter', 'yard'],
    required: true
  },
  baseUnit: String,
  conversionFactor: { type: Number, default: 1 },
  barcode: String,
  qrCode: String,
  images: [{
    url: String,
    publicId: String,
    isPrimary: Boolean
  }],
  variants: [{
    name: String,
    sku: String,
    attributes: Map,
    additionalPrice: Number
  }],
  pricing: {
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    wholesalePrice: Number,
    minimumPrice: Number,
    discountPrice: Number,
    discountStartDate: Date,
    discountEndDate: Date
  },
  stock: {
    current: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    minimumThreshold: { type: Number, default: 10 },
    maximumThreshold: Number,
    reorderPoint: Number
  },
  location: {
    warehouse: String,
    shelf: String,
    bin: String
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
productSchema.index({ businessId: 1, sku: 1 });
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ businessId: 1, 'stock.current': 1 });

module.exports = mongoose.model('Product', productSchema);