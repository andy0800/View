// backend/scripts/verifyAdminSettings.js
// Script to verify admin_settings table exists and works

const { sequelize, AdminSettings } = require('../src/models');

async function verifyAdminSettings() {
  try {
    console.log('🔍 Verifying admin_settings table...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'admin_settings' 
      AND table_schema = 'public'
    `);
    
    if (results.length === 0) {
      console.log('❌ admin_settings table does not exist');
      return false;
    }
    
    console.log('✅ admin_settings table exists');
    
    // Test model functionality
    const testSetting = await AdminSettings.setSetting(
      'test_setting',
      'test_value',
      'system',
      'Test setting for verification'
    );
    
    console.log('✅ AdminSettings.setSetting() works');
    
    const retrievedSetting = await AdminSettings.getSetting('test_setting');
    console.log('✅ AdminSettings.getSetting() works:', retrievedSetting);
    
    // Clean up test data
    await AdminSettings.destroy({
      where: { key: 'test_setting' }
    });
    
    console.log('✅ AdminSettings.destroy() works');
    
    // Test default settings initialization
    await AdminSettings.initializeDefaults();
    console.log('✅ Default settings initialized');
    
    const allSettings = await AdminSettings.getAllSettings();
    console.log(`✅ Found ${allSettings.length} admin settings`);
    
    console.log('\n🎉 admin_settings table verification COMPLETE!');
    console.log('✅ Table exists');
    console.log('✅ Model works');
    console.log('✅ CRUD operations work');
    console.log('✅ Default settings loaded');
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run verification
if (require.main === module) {
  verifyAdminSettings()
    .then((success) => {
      if (success) {
        console.log('\n✅ Admin settings verification PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ Admin settings verification FAILED');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Verification error:', error);
      process.exit(1);
    });
}

module.exports = { verifyAdminSettings };
