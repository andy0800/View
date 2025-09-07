// backend/scripts/forceDatabaseSync.js
const { sequelize } = require('../src/models');

async function forceDatabaseSync() {
  try {
    console.log('🔧 Force syncing database schema...');
    
    // Force sync with alter: true to add missing columns
    console.log('📊 Syncing database with force: true...');
    await sequelize.sync({ force: true });
    
    console.log('✅ Database schema force synced successfully!');
    console.log('📋 All tables have been recreated with the correct schema');
    console.log('⚠️  WARNING: All data has been lost - you will need to re-seed');
    
  } catch (error) {
    console.error('❌ Error during force sync:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the force sync
forceDatabaseSync();
