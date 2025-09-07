// backend/scripts/checkPackages.js
const { sequelize, AdvertiserPackage } = require('../src/models');

async function checkPackages() {
  try {
    console.log('🔍 Checking current advertiser packages...');
    
    const packages = await AdvertiserPackage.findAll({
      order: [['duration', 'ASC']]
    });
    
    console.log(`📦 Found ${packages.length} packages:`);
    packages.forEach(pkg => {
      console.log(`  - ${pkg.name} (${pkg.duration}s, ${pkg.price_per_view} KWD)`);
    });
    
    if (packages.length === 4) {
      console.log('✅ Perfect! Exactly 4 packages as expected.');
    } else {
      console.log(`❌ Expected 4 packages, but found ${packages.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking packages:', error);
  } finally {
    await sequelize.close();
  }
}

checkPackages();
