const User = require('../models/User');
const PlatformAdmin = require('../models/PlatformAdmin');
const { verifyToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
    
    // Check if user is platform admin
    if (decoded.isPlatformAdmin) {
      const admin = await PlatformAdmin.findById(decoded.userId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: 'Admin not found or inactive' });
      }
      req.user = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        isPlatformAdmin: true,
        permissions: admin.permissions || []
      };
    } else {
      // Regular business user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }
      req.user = {
        id: user._id,
        businessId: user.businessId,
        email: user.email,
        role: user.role,
        isPlatformAdmin: false,
        permissions: user.permissions
      };
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

// Alias for backward compatibility with authorize
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Platform admins can do everything
    if (req.user.isPlatformAdmin) {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route`,
        requiredRoles: roles
      });
    }
    next();
  };
};

// Check if user has specific permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.isPlatformAdmin) {
      return next();
    }
    
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ message: `Permission denied: ${permission} required` });
    }
  };
};

// Check if user can access a business
const canAccessBusiness = (req, res, next) => {
  const businessId = req.params.businessId || req.body.businessId;
  
  if (req.user.isPlatformAdmin) {
    return next();
  }
  
  if (!req.user.businessId) {
    return res.status(403).json({ message: 'No business associated with user' });
  }
  
  if (req.user.businessId.toString() !== businessId) {
    return res.status(403).json({ message: 'Access denied to this business' });
  }
  
  next();
};

// Platform admin only
const platformAdminOnly = (req, res, next) => {
  if (!req.user.isPlatformAdmin) {
    return res.status(403).json({ message: 'Platform admin access required' });
  }
  next();
};

// Super admin only
const superAdminOnly = (req, res, next) => {
  if (!req.user.isPlatformAdmin || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Owner or admin only
const ownerOrAdmin = (req, res, next) => {
  if (req.user.isPlatformAdmin || req.user.role === 'owner' || req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({ message: 'Owner/Manager access required' });
  }
};

module.exports = { 
  protect, 
  authorize,  // Added this export
  hasPermission, 
  canAccessBusiness, 
  platformAdminOnly, 
  superAdminOnly,
  ownerOrAdmin
};