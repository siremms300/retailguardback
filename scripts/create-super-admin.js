const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect directly to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'AfriGuardRetail'
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get direct database access
    const db = mongoose.connection.db;
    
    // Check if platformadmins collection exists
    const collections = await db.listCollections({ name: 'platformadmins' }).toArray();
    
    if (collections.length > 0) {
      // Check if super admin already exists
      const existingAdmin = await db.collection('platformadmins').findOne({ 
        role: 'super_admin' 
      });
      
      if (existingAdmin) {
        console.log('⚠️  Super admin already exists!');
        console.log('📧 Email:', existingAdmin.email);
        console.log('🆔 ID:', existingAdmin._id);
        await mongoose.disconnect();
        process.exit(0);
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Scoversedu1@', salt);
    
    // Create super admin document
    const superAdmin = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'siremms300@gmail.com',
      password: hashedPassword,
      role: 'super_admin',
      permissions: [
        'manage_businesses',
        'manage_subscriptions',
        'view_all_transactions',
        'manage_platform_settings',
        'view_analytics',
        'manage_support_tickets',
        'manage_admins'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert directly into collection
    const result = await db.collection('platformadmins').insertOne(superAdmin);
    
    console.log('\n✅ Super admin created successfully!');
    console.log('='.repeat(50));
    console.log('📧 Email: siremms300@gmail.com');
    console.log('🔑 Password: Scoversedu1@');
    console.log('🆔 ID:', result.insertedId);
    console.log('👤 Role: Super Admin');
    console.log('='.repeat(50));
    console.log('\n⚠️  IMPORTANT: Please change this password after first login!\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the function
createSuperAdmin();