// Reset advertiser packages data with correct micro-unit values
const { AdvertiserPackage } = require('./src/models');

async function resetPackagesData() {
  try {
    console.log('🔄 Resetting advertiser packages data...');
    
    // Clear existing packages
    await AdvertiserPackage.destroy({ where: {} });
    console.log('✅ Cleared existing packages');
    
    // Insert new packages with micro-unit values
    const packages = [
      {
        name: 'Basic Package',
        duration: 10,
        price_per_view_micro: 10000, // 0.010 KWD
        min_budget_micro: 300000000, // 300 KWD
        budget_increment_micro: 100000000, // 100 KWD
        description: '10-second video ads with maximum engagement',
        is_active: true
      },
      {
        name: 'Standard Package',
        duration: 15,
        price_per_view_micro: 14000, // 0.014 KWD
        min_budget_micro: 300000000, // 300 KWD
        budget_increment_micro: 100000000, // 100 KWD
        description: '15-second video ads with enhanced visibility',
        is_active: true
      },
      {
        name: 'Premium Package',
        duration: 20,
        price_per_view_micro: 16000, // 0.016 KWD
        min_budget_micro: 300000000, // 300 KWD
        budget_increment_micro: 100000000, // 100 KWD
        description: '20-second video ads with premium placement',
        is_active: true
      },
      {
        name: 'Extended Package',
        duration: 30,
        price_per_view_micro: 24000, // 0.024 KWD
        min_budget_micro: 300000000, // 300 KWD
        budget_increment_micro: 100000000, // 100 KWD
        description: '30-second video ads with extended reach',
        is_active: true
      }
    ];
    
    await AdvertiserPackage.bulkCreate(packages);
    console.log('✅ Created new packages with micro-unit values');
    
    // Verify the data
    const createdPackages = await AdvertiserPackage.findAll();
    console.log('📦 Created packages:', createdPackages.map(p => ({
      id: p.id,
      name: p.name,
      price_per_view_micro: p.price_per_view_micro,
      min_budget_micro: p.min_budget_micro,
      budget_increment_micro: p.budget_increment_micro
    })));
    
    console.log('✅ Package data reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting package data:', error);
    process.exit(1);
  }
}

// Run the reset
resetPackagesData();
