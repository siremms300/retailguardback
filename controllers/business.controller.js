// server/controllers/business.controller.js
const Business = require('../models/Business');

// Get business (with isolation)
const getBusiness = async (req, res) => {
  try {
    let business;
    
    if (req.user.isPlatformAdmin) {
      // Platform admin can get any business if businessId provided
      const businessId = req.params.businessId || req.user.businessId;
      business = await Business.findById(businessId);
    } else {
      // Regular user can only get their own business
      business = await Business.findById(req.user.businessId);
    }
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update business (with isolation)
const updateBusiness = async (req, res) => {
  try {
    const businessId = req.user.isPlatformAdmin 
      ? req.params.businessId || req.user.businessId
      : req.user.businessId;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 

const getBranches = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    res.json({ success: true, branches: business.branches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { branchName, branchCode, address, phone } = req.body;
    const business = await Business.findById(req.user.businessId);
    
    business.branches.push({
      branchName,
      branchCode,
      address,
      phone,
      isActive: true
    });
    
    await business.save();
    res.status(201).json({ success: true, branch: business.branches[business.branches.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const business = await Business.findById(req.user.businessId);
    
    const branch = business.branches.id(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    Object.assign(branch, req.body);
    await business.save();
    
    res.json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBusiness,
  updateBusiness,
  getBranches,
  createBranch,
  updateBranch
};