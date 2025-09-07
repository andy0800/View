// backend/scripts/checkPackageIds.js
const { sequelize, AdvertiserPackage } = require('../src/models');

async function checkPackageIds() {
  try {
    console.log('🔍 Checking current package IDs...');
    
    const packages = await AdvertiserPackage.findAll({
      order: [['duration', 'ASC']],
      attributes: ['id', 'name', 'duration', 'price_per_view']
    });
    
    console.log(`📦 Found ${packages.length} packages with IDs:`);
    packages.forEach(pkg => {
      console.log(`  - ID: ${pkg.id} | ${pkg.name} (${pkg.duration}s, ${pkg.price_per_view} KWD)`);
    });
    
    // Check if IDs are sequential
    const ids = packages.map(p => p.id);
    console.log('\n📋 Package IDs:', ids);
    
    if (ids.length === 4) {
      console.log('✅ Perfect! Exactly 4 packages as expected.');
    } else {
      console.log(`❌ Expected 4 packages, but found ${ids.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking package IDs:', error);
  } finally {
    await sequelize.close();
  }
}

checkPackageIds();
