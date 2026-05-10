// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required']
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId
  },
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'cashier', 'inventory_manager', 'security', 'accountant'],
    default: 'cashier'
  },
  permissions: [{
    type: String,
    enum: [
      'create_sale', 'void_sale', 'refund_sale',
      'manage_inventory', 'view_reports', 'manage_staff',
      'manage_pricing', 'reconcile_transactions', 'view_analytics'
    ]
  }],
  pin: {
    type: String,
    select: false
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: Date,
  loginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// SINGLE pre-save hook that handles everything
userSchema.pre('save', async function() {
  // Set permissions based on role
  if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
    const rolePermissions = {
      owner: ['create_sale', 'void_sale', 'refund_sale', 'manage_inventory', 'view_reports', 'manage_staff', 'manage_pricing', 'reconcile_transactions', 'view_analytics'],
      manager: ['create_sale', 'void_sale', 'refund_sale', 'manage_inventory', 'view_reports', 'manage_staff', 'manage_pricing', 'reconcile_transactions', 'view_analytics'],
      cashier: ['create_sale'],
      inventory_manager: ['manage_inventory', 'view_reports'],
      security: ['view_reports'],
      accountant: ['view_reports', 'reconcile_transactions', 'view_analytics']
    };
    this.permissions = rolePermissions[this.role] || [];
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Update timestamp
  this.updatedAt = new Date();
});

// Update timestamps on update
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);





































// // server/models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   businessId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Business',
//     required: [true, 'Business ID is required']
//   },
//   branchId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Business.branches'
//   },
//   firstName: {
//     type: String,
//     required: [true, 'First name is required']
//   },
//   lastName: {
//     type: String,
//     required: [true, 'Last name is required']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     unique: true
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: 6,
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['owner', 'manager', 'cashier', 'inventory_manager', 'security', 'accountant'],
//     default: 'cashier'
//   },
//   permissions: [{
//     type: String,
//     enum: [
//       'create_sale', 'void_sale', 'refund_sale',
//       'manage_inventory', 'view_reports', 'manage_staff',
//       'manage_pricing', 'reconcile_transactions', 'view_analytics'
//     ]
//   }],
//   pin: {
//     type: String,
//     select: false
//   },
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   },
//   lastLogin: Date,
//   loginAttempts: { 
//     type: Number, 
//     default: 0 
//   },
//   lockUntil: Date,
//   signedPolicies: [{
//     policyId: mongoose.Schema.Types.ObjectId,
//     signedAt: Date,
//     signatureHash: String
//   }],
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   updatedAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// });

// // FIXED: Hash password before saving
// userSchema.pre('save', async function(next) {
//   // Only hash if password is modified
//   if (!this.isModified('password')) {
//     return next();
//   }
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     this.updatedAt = Date.now();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // FIXED: Update timestamps on update
// userSchema.pre('findOneAndUpdate', function(next) {
//   this.set({ updatedAt: Date.now() });
//   next();
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) {
//     return false;
//   }
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Set default permissions based on role
// userSchema.pre('save', function(next) {
//   if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
//     const rolePermissions = {
//       owner: [
//         'create_sale', 'void_sale', 'refund_sale',
//         'manage_inventory', 'view_reports', 'manage_staff',
//         'manage_pricing', 'reconcile_transactions', 'view_analytics'
//       ],
//       manager: [
//         'create_sale', 'void_sale', 'refund_sale',
//         'manage_inventory', 'view_reports', 'manage_staff',
//         'manage_pricing', 'reconcile_transactions', 'view_analytics'
//       ],
//       cashier: [
//         'create_sale'
//       ],
//       inventory_manager: [
//         'manage_inventory', 'view_reports'
//       ],
//       security: [
//         'view_reports'
//       ],
//       accountant: [
//         'view_reports', 'reconcile_transactions', 'view_analytics'
//       ]
//     };
    
//     this.permissions = rolePermissions[this.role] || [];
//   }
//   next();
// });

// module.exports = mongoose.model('User', userSchema);




















































// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   businessId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Business',
//     required: [true, 'Business ID is required']
//   },
//   branchId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Business.branches'
//   },
//   firstName: {
//     type: String,
//     required: [true, 'First name is required']
//   },
//   lastName: {
//     type: String,
//     required: [true, 'Last name is required']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     unique: true
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: 6,
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['owner', 'manager', 'cashier', 'inventory_manager', 'security', 'accountant'],
//     default: 'cashier'
//   },
//   permissions: [{
//     type: String,
//     enum: [
//       'create_sale', 'void_sale', 'refund_sale',
//       'manage_inventory', 'view_reports', 'manage_staff',
//       'manage_pricing', 'reconcile_transactions', 'view_analytics'
//     ]
//   }],
//   pin: {
//     type: String,
//     select: false
//   },
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   },
//   lastLogin: Date,
//   loginAttempts: { 
//     type: Number, 
//     default: 0 
//   },
//   lockUntil: Date,
//   signedPolicies: [{
//     policyId: mongoose.Schema.Types.ObjectId,
//     signedAt: Date,
//     signatureHash: String
//   }],
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   updatedAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// });

// // Hash password before saving - FIXED VERSION
// userSchema.pre('save', async function(next) {
//   // Only hash if password is modified
//   if (!this.isModified('password')) {
//     return next();
//   }
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     this.updatedAt = Date.now();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Update timestamps on update
// userSchema.pre('findOneAndUpdate', function(next) {
//   this.set({ updatedAt: Date.now() });
//   next();
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) {
//     return false;
//   }
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Set default permissions based on role
// userSchema.pre('save', function(next) {
//   if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
//     const rolePermissions = {
//       owner: [
//         'create_sale', 'void_sale', 'refund_sale',
//         'manage_inventory', 'view_reports', 'manage_staff',
//         'manage_pricing', 'reconcile_transactions', 'view_analytics'
//       ],
//       manager: [
//         'create_sale', 'void_sale', 'refund_sale',
//         'manage_inventory', 'view_reports', 'manage_staff',
//         'manage_pricing', 'reconcile_transactions', 'view_analytics'
//       ],
//       cashier: [
//         'create_sale'
//       ],
//       inventory_manager: [
//         'manage_inventory', 'view_reports'
//       ],
//       security: [
//         'view_reports'
//       ],
//       accountant: [
//         'view_reports', 'reconcile_transactions', 'view_analytics'
//       ]
//     };
    
//     this.permissions = rolePermissions[this.role] || [];
//   }
//   next();
// });

// module.exports = mongoose.model('User', userSchema);