// server/models/Business.js
const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' }
  },
  branches: [{
    branchName: String,
    branchCode: String,
    address: String,
    phone: String,
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    settings: {
      requiresReceiptExit: { type: Boolean, default: true },
      autoReconcile: { type: Boolean, default: true }
    }
  }],
  settings: {
    currency: { type: String, default: 'NGN' },
    timezone: { type: String, default: 'Africa/Lagos' },
    receiptPrefix: String,
    lowStockAlert: { type: Number, default: 10 }
  },
  subscription: {
    plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// NO HOOKS - we'll update timestamps manually in controllers

module.exports = mongoose.model('Business', businessSchema);



















































// // server/models/Business.js
// const mongoose = require('mongoose');

// const businessSchema = new mongoose.Schema({
//   businessName: {
//     type: String,
//     required: [true, 'Business name is required'],
//     trim: true
//   },
//   registrationNumber: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required']
//   },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: { type: String, default: 'Nigeria' }
//   },
//   branches: [{
//     branchName: String,
//     branchCode: String,
//     address: String,
//     phone: String,
//     manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     isActive: { type: Boolean, default: true },
//     settings: {
//       requiresReceiptExit: { type: Boolean, default: true },
//       autoReconcile: { type: Boolean, default: true }
//     }
//   }],
//   settings: {
//     currency: { type: String, default: 'NGN' },
//     timezone: { type: String, default: 'Africa/Lagos' },
//     receiptPrefix: String,
//     lowStockAlert: { type: Number, default: 10 }
//   },
//   subscription: {
//     plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
//     startDate: Date,
//     endDate: Date,
//     isActive: { type: Boolean, default: true }
//   },
//   isActive: { type: Boolean, default: true },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // IMPORTANT: Use regular function, not arrow function
// businessSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// module.exports = mongoose.model('Business', businessSchema);




































// // server/models/Business.js
// const mongoose = require('mongoose');

// const businessSchema = new mongoose.Schema({
//   businessName: {
//     type: String,
//     required: [true, 'Business name is required'],
//     trim: true
//   },
//   registrationNumber: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required']
//   },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: { type: String, default: 'Nigeria' }
//   },
//   branches: [{
//     branchName: String,
//     branchCode: String,
//     address: String,
//     phone: String,
//     manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     isActive: { type: Boolean, default: true },
//     settings: {
//       requiresReceiptExit: { type: Boolean, default: true },
//       autoReconcile: { type: Boolean, default: true }
//     }
//   }],
//   settings: {
//     currency: { type: String, default: 'NGN' },
//     timezone: { type: String, default: 'Africa/Lagos' },
//     receiptPrefix: String,
//     lowStockAlert: { type: Number, default: 10 }
//   },
//   subscription: {
//     plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
//     startDate: Date,
//     endDate: Date,
//     isActive: { type: Boolean, default: true }
//   },
//   isActive: { type: Boolean, default: true },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // Update timestamp on save
// businessSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// // Update timestamp on findOneAndUpdate
// businessSchema.pre('findOneAndUpdate', function(next) {
//   this.set({ updatedAt: new Date() });
//   next();
// });

// module.exports = mongoose.model('Business', businessSchema);






























// const mongoose = require('mongoose');

// const businessSchema = new mongoose.Schema({
//   businessName: {
//     type: String,
//     required: [true, 'Business name is required'],
//     trim: true
//   },
//   registrationNumber: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required']
//   },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: { type: String, default: 'Nigeria' }
//   },
//   branches: [{
//     branchName: String,
//     branchCode: String,
//     address: String,
//     phone: String,
//     manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     isActive: { type: Boolean, default: true },
//     settings: {
//       requiresReceiptExit: { type: Boolean, default: true },
//       autoReconcile: { type: Boolean, default: true }
//     }
//   }],
//   settings: {
//     currency: { type: String, default: 'NGN' },
//     timezone: { type: String, default: 'Africa/Lagos' },
//     receiptPrefix: String,
//     lowStockAlert: { type: Number, default: 10 }
//   },
//   subscription: {
//     plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
//     startDate: Date,
//     endDate: Date,
//     isActive: { type: Boolean, default: true }
//   },
//   isActive: { type: Boolean, default: true },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// businessSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model('Business', businessSchema);