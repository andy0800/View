require('dotenv').config();
const { sequelize, AdvertiserPackage } = require('./src/models');

async function checkPackages() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all packages
    const packages = await AdvertiserPackage.findAll({
      raw: true
    });

    console.log('\n📦 Available Advertiser Packages:');
    console.log('-'.repeat(80));
    
    if (packages.length === 0) {
      console.log('❌ No packages found in database');
      return;
    }

    packages.forEach((pkg, index) => {
      console.log(`\nPackage ${index + 1}:`);
      console.log(`  ID: ${pkg.id}`);
      console.log(`  Name: ${pkg.name}`);
      console.log(`  Duration: ${pkg.duration}s`);
      console.log(`  Cost per view: ${pkg.cost_per_view} KWD`);
      console.log(`  Cost per view (micro): ${pkg.cost_per_view_micro}`);
      console.log(`  Reward per view: ${pkg.reward_per_view} KWD`);
      console.log(`  Reward per view (micro): ${pkg.reward_per_view_micro}`);
      console.log(`  Description: ${pkg.description}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPackages();
