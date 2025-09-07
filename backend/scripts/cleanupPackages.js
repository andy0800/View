// backend/scripts/cleanupPackages.js
const { sequelize, AdvertiserPackage } = require('../src/models');

async function cleanupPackages() {
  try {
    console.log('🧹 Cleaning up advertiser packages...');
    
    // First, let's see what packages exist
    const existingPackages = await AdvertiserPackage.findAll({
      order: [['duration', 'ASC']]
    });
    
    console.log(`📦 Found ${existingPackages.length} existing packages:`);
    existingPackages.forEach(pkg => {
      console.log(`  - ${pkg.name} (${pkg.duration}s, ${pkg.price_per_view} KWD)`);
    });
    
    // Delete all existing packages
    await AdvertiserPackage.destroy({ where: {} });
    console.log('🗑️  Deleted all existing packages');
    
    // Create the correct 4 packages according to the original plan
    const correctPackages = [
      {
        name: 'Basic Package',
        duration: 10, // 10 seconds
        price_per_view: 0.010, // 10 fils per view
        viewer_reward: 0.005, // 5 fils to viewer
        company_fee: 0.005, // 5 fils to company
        min_budget: 300.00, // 300 KWD starting budget
        budget_increment: 100.00, // 100 KWD increments
        is_active: true
      },
      {
        name: 'Standard Package',
        duration: 15, // 15 seconds
        price_per_view: 0.015, // 15 fils per view
        viewer_reward: 0.005, // 5 fils to viewer
        company_fee: 0.010, // 10 fils to company
        min_budget: 300.00, // 300 KWD starting budget
        budget_increment: 100.00, // 100 KWD increments
        is_active: true
      },
      {
        name: 'Premium Package',
        duration: 20, // 20 seconds
        price_per_view: 0.020, // 20 fils per view
        viewer_reward: 0.005, // 5 fils to viewer
        company_fee: 0.015, // 15 fils to company
        min_budget: 300.00, // 300 KWD starting budget
        budget_increment: 100.00, // 100 KWD increments
        is_active: true
      },
      {
        name: 'Extended Package',
        duration: 30, // 30 seconds
        price_per_view: 0.030, // 30 fils per view
        viewer_reward: 0.005, // 5 fils to viewer
        company_fee: 0.025, // 25 fils to company
        min_budget: 300.00, // 300 KWD starting budget
        budget_increment: 100.00, // 100 KWD increments
        is_active: true
      }
    ];
    
    // Insert the correct packages
    const createdPackages = await AdvertiserPackage.bulkCreate(correctPackages);
    console.log(`✅ Created ${createdPackages.length} correct packages:`);
    
    createdPackages.forEach(pkg => {
      console.log(`  - ${pkg.name} (${pkg.duration}s, ${pkg.price_per_view} KWD)`);
    });
    
    console.log('\n🎯 Package cleanup completed successfully!');
    console.log('📋 Only 4 packages now exist, exactly as per your original plan:');
    console.log('   1. Basic Package: 10s, 10 fils per view');
    console.log('   2. Standard Package: 15s, 15 fils per view');
    console.log('   3. Premium Package: 20s, 20 fils per view');
    console.log('   4. Extended Package: 30s, 30 fils per view');
    
  } catch (error) {
    console.error('❌ Error cleaning up packages:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the cleanup
cleanupPackages();
