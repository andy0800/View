require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...');
    
    // Check viewers
    const [viewerCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE role = \'viewer\'',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`👥 Viewers: ${viewerCount.count}`);
    
    // Check ads
    const [adCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM ads WHERE status = \'active\'',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`📹 Active ads: ${adCount.count}`);
    
    // Check total ads
    const [totalAdCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM ads',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`📹 Total ads: ${totalAdCount.count}`);
    
    // Check advertisers
    const [advertiserCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE role = \'advertiser\'',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`🏢 Advertisers: ${advertiserCount.count}`);
    
    await sequelize.close();
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    await sequelize.close();
  }
}

checkDatabaseState();
