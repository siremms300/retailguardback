// server/models/PlatformAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const platformAdminSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'support_admin', 'billing_admin', 'analytics_admin'],
    default: 'support_admin'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_businesses',
      'manage_subscriptions',
      'view_all_transactions',
      'manage_platform_settings',
      'view_analytics',
      'manage_support_tickets',
      'manage_admins'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// SINGLE pre-save hook
platformAdminSchema.pre('save', async function() {
  // Set permissions based on role
  if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
    const rolePermissions = {
      super_admin: ['manage_businesses', 'manage_subscriptions', 'view_all_transactions', 'manage_platform_settings', 'view_analytics', 'manage_support_tickets', 'manage_admins'],
      support_admin: ['view_all_transactions', 'manage_support_tickets'],
      billing_admin: ['manage_subscriptions'],
      analytics_admin: ['view_analytics', 'view_all_transactions']
    };
    this.permissions = rolePermissions[this.role] || [];
  }
  
  // Hash password
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  this.updatedAt = new Date();
});

platformAdminSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

platformAdminSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('PlatformAdmin', platformAdminSchema);





















// // server/models/PlatformAdmin.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const platformAdminSchema = new mongoose.Schema({
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
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: 6,
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['super_admin', 'support_admin', 'billing_admin', 'analytics_admin'],
//     default: 'support_admin'
//   },
//   permissions: [{
//     type: String,
//     enum: [
//       'manage_businesses',
//       'manage_subscriptions',
//       'view_all_transactions',
//       'manage_platform_settings',
//       'view_analytics',
//       'manage_support_tickets',
//       'manage_admins'
//     ]
//   }],
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   lastLogin: {
//     type: Date
//   },
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
// platformAdminSchema.pre('save', async function(next) {
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
// platformAdminSchema.pre('findOneAndUpdate', function(next) {
//   this.set({ updatedAt: Date.now() });
//   next();
// });

// // Compare password method
// platformAdminSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) {
//     return false;
//   }
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Set default permissions based on role
// platformAdminSchema.pre('save', function(next) {
//   if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
//     const rolePermissions = {
//       super_admin: [
//         'manage_businesses',
//         'manage_subscriptions',
//         'view_all_transactions',
//         'manage_platform_settings',
//         'view_analytics',
//         'manage_support_tickets',
//         'manage_admins'
//       ],
//       support_admin: [
//         'view_all_transactions',
//         'manage_support_tickets'
//       ],
//       billing_admin: [
//         'manage_subscriptions'
//       ],
//       analytics_admin: [
//         'view_analytics',
//         'view_all_transactions'
//       ]
//     };
    
//     this.permissions = rolePermissions[this.role] || [];
//   }
//   next();
// });

// module.exports = mongoose.model('PlatformAdmin', platformAdminSchema);
















































// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const platformAdminSchema = new mongoose.Schema({
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
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: 6,
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['super_admin', 'support_admin', 'billing_admin', 'analytics_admin'],
//     default: 'support_admin'
//   },
//   permissions: [{
//     type: String,
//     enum: [
//       'manage_businesses',
//       'manage_subscriptions',
//       'view_all_transactions',
//       'manage_platform_settings',
//       'view_analytics',
//       'manage_support_tickets',
//       'manage_admins'
//     ]
//   }],
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   lastLogin: {
//     type: Date
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // FIXED: Hash password before saving - NO "next" parameter needed in async function
// platformAdminSchema.pre('save', async function() {
//   // Only hash if password is modified
//   if (!this.isModified('password')) {
//     return;
//   }
  
//   const salt = await bcrypt.genSalt(12);
//   this.password = await bcrypt.hash(this.password, salt);
//   this.updatedAt = Date.now();
// });

// // Update timestamps on update
// platformAdminSchema.pre('findOneAndUpdate', async function() {
//   this.set({ updatedAt: Date.now() });
// });

// // Compare password method
// platformAdminSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) {
//     return false;
//   }
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Set default permissions based on role
// platformAdminSchema.pre('save', function() {
//   if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
//     const rolePermissions = {
//       super_admin: [
//         'manage_businesses',
//         'manage_subscriptions',
//         'view_all_transactions',
//         'manage_platform_settings',
//         'view_analytics',
//         'manage_support_tickets',
//         'manage_admins'
//       ],
//       support_admin: [
//         'view_all_transactions',
//         'manage_support_tickets'
//       ],
//       billing_admin: [
//         'manage_subscriptions'
//       ],
//       analytics_admin: [
//         'view_analytics',
//         'view_all_transactions'
//       ]
//     };
    
//     this.permissions = rolePermissions[this.role] || [];
//   }
// });

// module.exports = mongoose.model('PlatformAdmin', platformAdminSchema);