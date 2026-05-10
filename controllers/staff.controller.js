const User = require('../models/User');

const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ 
      businessId: req.user.businessId,
      role: { $ne: 'owner' }
    }).select('-password');
    
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const addStaff = async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, password, role, permissions } = req.body;
    
//     const staff = await User.create({
//       businessId: req.user.businessId,
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       role,
//       permissions: permissions || []
//     });
    
//     res.status(201).json({ 
//       success: true, 
//       staff: {
//         id: staff._id,
//         firstName: staff.firstName,
//         lastName: staff.lastName,
//         email: staff.email,
//         role: staff.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };







const addStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, permissions } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const staff = await User.create({
      businessId: req.user.businessId,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      permissions: permissions || []
    });
    
    res.status(201).json({ 
      success: true, 
      staff: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 






const updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const updates = req.body;
    
    // Don't allow password update here
    delete updates.password;
    
    const staff = await User.findByIdAndUpdate(
      staffId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    await User.findByIdAndUpdate(staffId, { isActive: false });
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStaffActivity = async (req, res) => {
  try {
    const { staffId } = req.params;
    // This would query the audit logs table
    res.json({ success: true, activity: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  getStaffActivity
};