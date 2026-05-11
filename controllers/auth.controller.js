// server/controllers/auth.controller.js
const User = require('../models/User');
const Business = require('../models/Business');
const PlatformAdmin = require('../models/platformAdmin');
const { generateToken, generateAdminToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// Business User Registration
const registerBusiness = async (req, res) => {
  try {
    const { business, owner } = req.body;
    
    if (!business || !business.name || !business.email || !business.phone || !business.address) {
      return res.status(400).json({ message: 'All business fields are required' });
    }
    
    if (!owner || !owner.firstName || !owner.lastName || !owner.email || !owner.phone || !owner.password) {
      return res.status(400).json({ message: 'All owner fields are required' });
    }
    
    // Check existing
    const existingBusiness = await Business.findOne({ email: business.email });
    if (existingBusiness) {
      return res.status(400).json({ message: 'Business email already registered' });
    }
    
    const existingUser = await User.findOne({ email: owner.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Owner email already registered' });
    }

    const existingPhone = await User.findOne({ phone: owner.phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    
    // Hash password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(owner.password, salt);
    
    // Create business
    const newBusiness = await Business.create({
      businessName: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      registrationNumber: business.registrationNumber || undefined,
      subscription: {
        plan: 'starter',
        isActive: true,
        startDate: new Date()
      }
    });
    
    // Set default permissions for owner
    const ownerPermissions = [
      'create_sale', 'void_sale', 'refund_sale',
      'manage_inventory', 'view_reports', 'manage_staff',
      'manage_pricing', 'reconcile_transactions', 'view_analytics'
    ];
    
    // Create owner user
    const ownerUser = await User.create({
      businessId: newBusiness._id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      password: hashedPassword,
      role: 'owner',
      permissions: ownerPermissions
    });
    
    // Generate token
    const token = generateToken(ownerUser._id, newBusiness._id, 'owner', false);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: ownerUser._id,
        firstName: ownerUser.firstName,
        lastName: ownerUser.lastName,
        name: ownerUser.firstName + ' ' + ownerUser.lastName,
        email: ownerUser.email,
        role: ownerUser.role,
        isPlatformAdmin: false,
        businessId: newBusiness._id
      },
      business: {
        id: newBusiness._id,
        name: newBusiness.businessName,
        email: newBusiness.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      var field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: field.charAt(0).toUpperCase() + field.slice(1) + ' already exists' 
      });
    }
    
    if (error.name === 'ValidationError') {
      var messages = Object.values(error.errors).map(function(err) {
        return err.message;
      });
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
};

// Business User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated. Contact support.' });
    }
    
    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    await user.save();
    
    const token = generateToken(user._id, user.businessId, user.role, false);
    const business = await Business.findById(user.businessId);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isPlatformAdmin: false,
        businessId: user.businessId
      },
      business: {
        id: business ? business._id : null,
        name: business ? business.businessName : null,
        subscription: business ? business.subscription : null
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed: ' + error.message });
  }
};

// Platform Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const admin = await PlatformAdmin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    if (!admin.isActive) {
      return res.status(401).json({ message: 'Admin account deactivated' });
    }
    
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    admin.lastLogin = new Date();
    await admin.save();
    
    const token = generateAdminToken(admin._id, admin.role);
    
    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        name: admin.firstName + ' ' + admin.lastName,
        email: admin.email,
        role: admin.role,
        isPlatformAdmin: true
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Admin login failed: ' + error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    if (req.user.isPlatformAdmin) {
      const admin = await PlatformAdmin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      res.json({
        success: true,
        user: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          name: admin.firstName + ' ' + admin.lastName,
          email: admin.email,
          role: admin.role,
          isPlatformAdmin: true
        }
      });
    } else {
      const user = await User.findById(req.user.id).populate('businessId', 'businessName email subscription');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          isPlatformAdmin: false,
          businessId: user.businessId ? user.businessId._id : null,
          business: user.businessId
        }
      });
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Failed to get user details' });
  }
};

module.exports = { registerBusiness, login, adminLogin, getMe };





































// // server/controllers/auth.controller.js
// const User = require('../models/User');
// const Business = require('../models/Business');
// const PlatformAdmin = require('../models/PlatformAdmin');
// const { generateToken, generateAdminToken } = require('../utils/jwt');

// // Business User Registration
// // const registerBusiness = async (req, res) => {
// //   try {
// //     const { business, owner } = req.body;
    
// //     // Validate required fields
// //     if (!business || !business.name || !business.email || !business.phone || !business.address) {
// //       return res.status(400).json({ message: 'All business fields are required' });
// //     }
    
// //     if (!owner || !owner.firstName || !owner.lastName || !owner.email || !owner.phone || !owner.password) {
// //       return res.status(400).json({ message: 'All owner fields are required' });
// //     }
    
// //     // Check if business email exists
// //     const existingBusiness = await Business.findOne({ email: business.email });
// //     if (existingBusiness) {
// //       return res.status(400).json({ message: 'Business email already registered' });
// //     }
    
// //     // Check if owner email exists
// //     const existingUser = await User.findOne({ email: owner.email });
// //     if (existingUser) {
// //       return res.status(400).json({ message: 'Owner email already registered' });
// //     }

// //     // Check if owner phone exists
// //     const existingPhone = await User.findOne({ phone: owner.phone });
// //     if (existingPhone) {
// //       return res.status(400).json({ message: 'Phone number already registered' });
// //     }
    
// //     // Create business
// //     const newBusiness = await Business.create({
// //       businessName: business.name,
// //       email: business.email,
// //       phone: business.phone,
// //       address: business.address,
// //       registrationNumber: business.registrationNumber || undefined,
// //       subscription: {
// //         plan: 'starter',
// //         isActive: true,
// //         startDate: new Date()
// //       }
// //     });
    
// //     // Create owner user
// //     const ownerUser = await User.create({
// //       businessId: newBusiness._id,
// //       firstName: owner.firstName,
// //       lastName: owner.lastName,
// //       email: owner.email,
// //       phone: owner.phone,
// //       password: owner.password,
// //       role: 'owner'
// //     });
    
// //     // Generate token
// //     const token = generateToken(ownerUser._id, newBusiness._id, 'owner', false);
    
// //     res.status(201).json({
// //       success: true,
// //       token,
// //       user: {
// //         id: ownerUser._id,
// //         firstName: ownerUser.firstName,
// //         lastName: ownerUser.lastName,
// //         name: ownerUser.firstName + ' ' + ownerUser.lastName,
// //         email: ownerUser.email,
// //         role: ownerUser.role,
// //         isPlatformAdmin: false,
// //         businessId: newBusiness._id
// //       },
// //       business: {
// //         id: newBusiness._id,
// //         name: newBusiness.businessName,
// //         email: newBusiness.email
// //       }
// //     });
    
// //   } catch (error) {
// //     console.error('Registration error:', error);
    
// //     // Handle duplicate key errors
// //     if (error.code === 11000) {
// //       const field = Object.keys(error.keyValue)[0];
// //       return res.status(400).json({ 
// //         message: field.charAt(0).toUpperCase() + field.slice(1) + ' already exists' 
// //       });
// //     }
    
// //     // Handle validation errors
// //     if (error.name === 'ValidationError') {
// //       const messages = Object.values(error.errors).map(function(err) {
// //         return err.message;
// //       });
// //       return res.status(400).json({ message: messages.join(', ') });
// //     }
    
// //     res.status(500).json({ message: 'Registration failed. Please try again.' });
// //   }
// // };


 
// const registerBusiness = async (req, res) => {
//   try {
//     const { business, owner } = req.body;
    
//     if (!business || !business.name || !business.email || !business.phone || !business.address) {
//       return res.status(400).json({ message: 'All business fields are required' });
//     }
    
//     if (!owner || !owner.firstName || !owner.lastName || !owner.email || !owner.phone || !owner.password) {
//       return res.status(400).json({ message: 'All owner fields are required' });
//     }
    
//     const existingBusiness = await Business.findOne({ email: business.email });
//     if (existingBusiness) {
//       return res.status(400).json({ message: 'Business email already registered' });
//     }
    
//     const existingUser = await User.findOne({ email: owner.email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Owner email already registered' });
//     }

//     const existingPhone = await User.findOne({ phone: owner.phone });
//     if (existingPhone) {
//       return res.status(400).json({ message: 'Phone number already registered' });
//     }
    
//     const newBusiness = await Business.create({
//       businessName: business.name,
//       email: business.email,
//       phone: business.phone,
//       address: business.address,
//       registrationNumber: business.registrationNumber || undefined,
//       subscription: {
//         plan: 'starter',
//         isActive: true,
//         startDate: new Date()
//       }
//     });
    
//     const ownerUser = await User.create({
//       businessId: newBusiness._id,
//       firstName: owner.firstName,
//       lastName: owner.lastName,
//       email: owner.email,
//       phone: owner.phone,
//       password: owner.password,
//       role: 'owner'
//     });
    
//     const token = generateToken(ownerUser._id, newBusiness._id, 'owner', false);
    
//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         id: ownerUser._id,
//         firstName: ownerUser.firstName,
//         lastName: ownerUser.lastName,
//         name: ownerUser.firstName + ' ' + ownerUser.lastName,
//         email: ownerUser.email,
//         role: ownerUser.role,
//         isPlatformAdmin: false,
//         businessId: newBusiness._id
//       },
//       business: {
//         id: newBusiness._id,
//         name: newBusiness.businessName,
//         email: newBusiness.email
//       }
//     });
    
//   } catch (error) {
//     console.error('Registration error:', error);
    
//     if (error.code === 11000) {
//       var field = Object.keys(error.keyValue)[0];
//       return res.status(400).json({ 
//         message: field.charAt(0).toUpperCase() + field.slice(1) + ' already exists' 
//       });
//     }
    
//     if (error.name === 'ValidationError') {
//       var messages = Object.values(error.errors).map(function(err) {
//         return err.message;
//       });
//       return res.status(400).json({ message: messages.join(', ') });
//     }
    
//     res.status(500).json({ message: 'Registration failed. Please try again.' });
//   }
// };
 

// // Business User Login
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }
    
//     // Find user with password
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }
    
//     if (!user.isActive) {
//       return res.status(401).json({ message: 'Account deactivated. Contact support.' });
//     }
    
//     // Check if account is locked
//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
//       return res.status(401).json({ 
//         message: 'Account locked. Try again in ' + minutesLeft + ' minutes.' 
//       });
//     }
    
//     // Check password
//     const isPasswordMatch = await user.comparePassword(password);
    
//     if (!isPasswordMatch) {
//       // Increment login attempts
//       user.loginAttempts = (user.loginAttempts || 0) + 1;
      
//       // Lock account after 5 failed attempts
//       if (user.loginAttempts >= 5) {
//         user.lockUntil = new Date(Date.now() + 30 * 60000); // Lock for 30 minutes
//       }
      
//       await user.save();
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }
    
//     // Reset login attempts
//     user.loginAttempts = 0;
//     user.lockUntil = undefined;
//     user.lastLogin = new Date();
//     await user.save();
    
//     // Generate token
//     const token = generateToken(user._id, user.businessId, user.role, false);
    
//     // Get business info
//     const business = await Business.findById(user.businessId);
    
//     res.json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         name: user.firstName + ' ' + user.lastName,
//         email: user.email,
//         role: user.role,
//         permissions: user.permissions,
//         isPlatformAdmin: false,
//         businessId: user.businessId
//       },
//       business: {
//         id: business ? business._id : null,
//         name: business ? business.businessName : null,
//         subscription: business ? business.subscription : null
//       }
//     });
    
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Login failed. Please try again.' });
//   }
// };

// // Platform Admin Login
// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }
    
//     const admin = await PlatformAdmin.findOne({ email }).select('+password');
    
//     if (!admin) {
//       return res.status(401).json({ message: 'Invalid admin credentials' });
//     }
    
//     if (!admin.isActive) {
//       return res.status(401).json({ message: 'Admin account deactivated' });
//     }
    
//     const isPasswordMatch = await admin.comparePassword(password);
    
//     if (!isPasswordMatch) {
//       return res.status(401).json({ message: 'Invalid admin credentials' });
//     }
    
//     admin.lastLogin = new Date();
//     await admin.save();
    
//     const token = generateAdminToken(admin._id, admin.role);
    
//     res.json({
//       success: true,
//       token,
//       user: {
//         id: admin._id,
//         firstName: admin.firstName,
//         lastName: admin.lastName,
//         name: admin.firstName + ' ' + admin.lastName,
//         email: admin.email,
//         role: admin.role,
//         isPlatformAdmin: true
//       }
//     });
    
//   } catch (error) {
//     console.error('Admin login error:', error);
//     res.status(500).json({ message: 'Admin login failed. Please try again.' });
//   }
// };

// // Get current user
// const getMe = async (req, res) => {
//   try {
//     if (req.user.isPlatformAdmin) {
//       const admin = await PlatformAdmin.findById(req.user.id);
//       if (!admin) {
//         return res.status(404).json({ message: 'Admin not found' });
//       }
//       res.json({
//         success: true,
//         user: {
//           id: admin._id,
//           firstName: admin.firstName,
//           lastName: admin.lastName,
//           name: admin.firstName + ' ' + admin.lastName,
//           email: admin.email,
//           role: admin.role,
//           isPlatformAdmin: true
//         }
//       });
//     } else {
//       const user = await User.findById(req.user.id).populate('businessId', 'businessName email subscription');
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
//       res.json({
//         success: true,
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           name: user.firstName + ' ' + user.lastName,
//           email: user.email,
//           role: user.role,
//           permissions: user.permissions,
//           isPlatformAdmin: false,
//           businessId: user.businessId ? user.businessId._id : null,
//           business: user.businessId
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Get me error:', error);
//     res.status(500).json({ message: 'Failed to get user details' });
//   }
// };

// module.exports = { registerBusiness, login, adminLogin, getMe };




















































// const User = require('../models/User');
// const Business = require('../models/Business');
// const PlatformAdmin = require('../models/PlatformAdmin');
// const { generateToken, generateAdminToken } = require('../utils/jwt');

// // Business User Registration
// const registerBusiness = async (req, res) => {
//   try {
//     const { business, owner } = req.body;
    
//     // Check if business email exists
//     const existingBusiness = await Business.findOne({ email: business.email });
//     if (existingBusiness) {
//       return res.status(400).json({ message: 'Business already registered' });
//     }
    
//     // Check if owner email exists
//     const existingUser = await User.findOne({ email: owner.email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }
    
//     // Create business
//     const newBusiness = await Business.create({
//       businessName: business.name,
//       email: business.email,
//       phone: business.phone,
//       address: business.address,
//       registrationNumber: business.registrationNumber,
//       subscription: {
//         plan: 'starter',
//         isActive: true,
//         startDate: new Date()
//       }
//     });
    
//     // Create owner user
//     const ownerUser = await User.create({
//       businessId: newBusiness._id,
//       firstName: owner.firstName,
//       lastName: owner.lastName,
//       email: owner.email,
//       phone: owner.phone,
//       password: owner.password,
//       role: 'owner',
//       isPlatformAdmin: false,
//       permissions: [
//         'create_sale', 'void_sale', 'refund_sale',
//         'manage_inventory', 'view_reports', 'manage_staff',
//         'manage_pricing', 'reconcile_transactions', 'view_analytics'
//       ]
//     });
    
//     // Generate token
//     const token = generateToken(ownerUser._id, newBusiness._id, 'owner', false);
    
//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         id: ownerUser._id,
//         name: `${ownerUser.firstName} ${ownerUser.lastName}`,
//         email: ownerUser.email,
//         role: ownerUser.role,
//         isPlatformAdmin: false
//       },
//       business: {
//         id: newBusiness._id,
//         name: newBusiness.businessName,
//         email: newBusiness.email
//       }
//     });
    
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Business User Login
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     // Find user
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
    
//     if (!user.isActive) {
//       return res.status(401).json({ message: 'Account deactivated. Contact support.' });
//     }
    
//     // Check password
//     const isPasswordMatch = await user.comparePassword(password);
    
//     if (!isPasswordMatch) {
//       user.loginAttempts += 1;
//       await user.save();
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
    
//     // Reset login attempts
//     user.loginAttempts = 0;
//     user.lastLogin = new Date();
//     await user.save();
    
//     // Generate token
//     const token = generateToken(user._id, user.businessId, user.role, false);
    
//     // Get business info
//     const business = await Business.findById(user.businessId);
    
//     res.json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         name: `${user.firstName} ${user.lastName}`,
//         email: user.email,
//         role: user.role,
//         permissions: user.permissions,
//         isPlatformAdmin: false
//       },
//       business: {
//         id: business._id,
//         name: business.businessName,
//         subscription: business.subscription
//       }
//     });
    
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Platform Admin Login
// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     const admin = await PlatformAdmin.findOne({ email }).select('+password');
    
//     if (!admin) {
//       return res.status(401).json({ message: 'Invalid admin credentials' });
//     }
    
//     if (!admin.isActive) {
//       return res.status(401).json({ message: 'Admin account deactivated' });
//     }
    
//     const isPasswordMatch = await admin.comparePassword(password);
    
//     if (!isPasswordMatch) {
//       return res.status(401).json({ message: 'Invalid admin credentials' });
//     }
    
//     admin.lastLogin = new Date();
//     await admin.save();
    
//     const token = generateAdminToken(admin._id, admin.role);
    
//     res.json({
//       success: true,
//       token,
//       user: {
//         id: admin._id,
//         name: `${admin.firstName} ${admin.lastName}`,
//         email: admin.email,
//         role: admin.role,
//         isPlatformAdmin: true
//       }
//     });
    
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get current user
// const getMe = async (req, res) => {
//   try {
//     if (req.user.isPlatformAdmin) {
//       const admin = await PlatformAdmin.findById(req.user.id);
//       res.json({
//         success: true,
//         user: {
//           id: admin._id,
//           name: `${admin.firstName} ${admin.lastName}`,
//           email: admin.email,
//           role: admin.role,
//           isPlatformAdmin: true
//         }
//       });
//     } else {
//       const user = await User.findById(req.user.id).populate('businessId', 'businessName email subscription');
//       res.json({
//         success: true,
//         user: {
//           id: user._id,
//           name: `${user.firstName} ${user.lastName}`,
//           email: user.email,
//           role: user.role,
//           permissions: user.permissions,
//           isPlatformAdmin: false,
//           business: user.businessId
//         }
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = { registerBusiness, login, adminLogin, getMe };