// server/utils/jwt.js

const jwt = require('jsonwebtoken');

const generateToken = (userId, businessId, role, isPlatformAdmin = false) => {
  return jwt.sign(
    { userId, businessId, role, isPlatformAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateAdminToken = (adminId, role) => {
  return jwt.sign(
    { userId: adminId, role, isPlatformAdmin: true },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, generateAdminToken, verifyToken };