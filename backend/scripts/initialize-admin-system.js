// backend/scripts/initialize-admin-system.js
const { sequelize } = require('../src/models');
const AdminSettings = require('../src/models/adminSettings');
const CompanyWallet = require('../src/models/companyWallet');
const Notification = require('../src/models/notification');

async function initializeAdminSystem() {
  try {
    console.log('🚀 Initializing Admin System...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced');
    
    // Initialize admin settings
    console.log('⚙️ Initializing admin settings...');
    await AdminSettings.initializeDefaults();
    console.log('✅ Admin settings initialized');
    
    // Create or get main company wallet
    console.log('💰 Setting up company wallet...');
    const mainWallet = await CompanyWallet.getOrCreateMainWallet();
    console.log(`✅ Company wallet ready: ${mainWallet.name} (Balance: ${mainWallet.getBalanceKWD()} KWD)`);
    
    // Test notification system
    console.log('🔔 Testing notification system...');
    const testNotification = await Notification.createSystemAlert(
      '00000000-0000-0000-0000-000000000001', // Use a test admin ID
      'System Initialized',
      'Admin system has been successfully initialized',
      'low'
    );
    console.log('✅ Test notification created');
    
    // Clean up test notification
    await testNotification.destroy();
    console.log('✅ Test notification cleaned up');
    
    console.log('\n🎉 Admin System Initialization Complete!');
    console.log('\n📋 What was set up:');
    console.log('   • Admin Settings table with default configurations');
    console.log('   • Notifications table for admin alerts');
    console.log('   • Enhanced Company Wallet with comprehensive tracking');
    console.log('   • Database indexes for optimal performance');
    console.log('\n🔧 Next steps:');
    console.log('   1. Run the application to test the new admin features');
    console.log('   2. Access admin settings at /admin/settings');
    console.log('   3. View company dashboard at /admin/company');
    console.log('   4. Check notifications at /admin/notifications');
    
  } catch (error) {
    console.error('❌ Error initializing admin system:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  initializeAdminSystem();
}

module.exports = initializeAdminSystem;
