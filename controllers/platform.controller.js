const Business = require('../models/Business');
const User = require('../models/User');
const PlatformAdmin = require('../models/platformAdmin');
const Transaction = require('../models/Transaction');

// Get all businesses (platform admin)
const getAllBusinesses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    
    if (status === 'active') query['subscription.isActive'] = true;
    if (status === 'inactive') query['subscription.isActive'] = false;
    
    const businesses = await Business.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Business.countDocuments(query);
    
    res.json({
      success: true,
      businesses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get business details
const getBusinessDetails = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    const staff = await User.find({ businessId, isActive: true });
    const transactions = await Transaction.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      business,
      stats: {
        totalStaff: staff.length,
        totalTransactions: await Transaction.countDocuments({ businessId }),
        totalRevenue: await Transaction.aggregate([
          { $match: { businessId: business._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      },
      recentTransactions: transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const totalBusinesses = await Business.countDocuments();
    const activeBusinesses = await Business.countDocuments({ 'subscription.isActive': true });
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const revenueResult = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // Calculate growth (mock data for now - you can implement real calculation)
    const revenueGrowth = 15;
    const businessGrowth = 8;
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('businessId', 'businessName');
    
    res.json({
      success: true,
      stats: {
        totalBusinesses,
        activeBusinesses,
        totalUsers,
        totalTransactions,
        totalRevenue,
        revenueGrowth,
        businessGrowth,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent transactions
const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('businessId', 'businessName')
      .populate('cashierId', 'firstName lastName');
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all platform users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('businessId', 'businessName')
      .select('-password');
    
    const admins = await PlatformAdmin.find().select('-password');
    
    res.json({
      success: true,
      businessUsers: users,
      platformAdmins: admins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      { 
        name: 'starter', 
        price: 5000, 
        features: ['1 Branch', '3 Staff', 'Basic Support'],
        businesses: await Business.countDocuments({ 'subscription.plan': 'starter' })
      },
      { 
        name: 'growth', 
        price: 15000, 
        features: ['5 Branches', '15 Staff', 'Priority Support', 'Advanced Analytics'],
        businesses: await Business.countDocuments({ 'subscription.plan': 'growth' })
      },
      { 
        name: 'enterprise', 
        price: 'Custom', 
        features: ['Unlimited', 'Custom Integration', 'Dedicated Support', 'SLA'],
        businesses: await Business.countDocuments({ 'subscription.plan': 'enterprise' })
      }
    ];
    
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update business subscription
const updateSubscription = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { plan } = req.body;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { 
        'subscription.plan': plan,
        'subscription.updatedAt': new Date()
      },
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Subscription updated to ${plan}`,
      business 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get platform activity logs
const getActivityLogs = async (req, res) => {
  try {
    // This would fetch from an ActivityLog model
    // For now, return mock data
    res.json({ 
      success: true, 
      activities: [
        { id: 1, action: 'User logged in', user: 'admin@afriguard.com', time: new Date(), type: 'auth' },
        { id: 2, action: 'New business registered', user: 'john@example.com', time: new Date(), type: 'business' }
      ] 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suspend business
const suspendBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { 
        'subscription.isActive': false,
        isActive: false
      },
      { new: true }
    );
    
    // Also deactivate all users
    await User.updateMany(
      { businessId },
      { isActive: false }
    );
    
    res.json({ success: true, message: 'Business suspended', business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate business
const activateBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { 
        'subscription.isActive': true,
        isActive: true
      },
      { new: true }
    );
    
    // Reactivate owner only
    await User.updateOne(
      { businessId, role: 'owner' },
      { isActive: true }
    );
    
    res.json({ success: true, message: 'Business activated', business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create platform admin
const createPlatformAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    const existingAdmin = await PlatformAdmin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    
    const admin = await PlatformAdmin.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'support_admin'
    });
    
    res.status(201).json({
      success: true,
      message: 'Platform admin created',
      admin: {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBusinesses,
  getBusinessDetails,
  suspendBusiness,
  activateBusiness,
  getAllUsers,
  getPlatformStats,
  getRecentTransactions,
  getSubscriptionPlans,
  updateSubscription,
  getActivityLogs,
  createPlatformAdmin
};