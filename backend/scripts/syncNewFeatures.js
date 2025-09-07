// backend/scripts/syncNewFeatures.js
const { sequelize } = require('../src/models');

async function syncNewFeatures() {
  try {
    console.log('🔄 Syncing database with new CTA and comment features...');
    
    // Sync all models (this will add the new CTA fields to ads table and create comment tables)
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synced successfully with new features!');
    console.log('\n📋 New features added:');
    console.log('  1. ✅ CTA fields to ads table:');
    console.log('     - cta_link (URL for call-to-action)');
    console.log('     - cta_text (button text)');
    console.log('     - cta_enabled (boolean to enable/disable)');
    console.log('  2. ✅ New Comment table with:');
    console.log('     - User attribution');
    console.log('     - Like system');
    console.log('     - Reply system');
    console.log('     - Soft delete support');
    console.log('  3. ✅ New CommentLike table for engagement tracking');
    
    console.log('\n🚀 You can now:');
    console.log('  - Set CTA links and text when creating ads');
    console.log('  - View and interact with comments on videos');
    console.log('  - Track comment engagement in ad statistics');
    
  } catch (error) {
    console.error('❌ Error syncing database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncNewFeatures();
