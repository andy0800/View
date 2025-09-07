// backend/scripts/injectAdvertiserPackages.js
// Script to inject advertiser packages according to original VIEW APP structure

const { AdvertiserPackage } = require('../src/models');

async function injectAdvertiserPackages() {
  try {
    console.log('🚀 Starting advertiser packages injection...');
    
    // Check if packages already exist
    const existingPackages = await AdvertiserPackage.findAll();
    
    if (existingPackages.length > 0) {
      console.log('⚠️ Advertiser packages already exist:');
      existingPackages.forEach(pkg => {
        console.log(`  📦 ${pkg.name}: ${pkg.duration}s - ${pkg.price_per_view} fils/view`);
      });
      return;
    }

    // Define packages according to original VIEW APP structure
    const packages = [
      {
        name: '10 Second Package',
        duration: 10,
        price_per_view: 0.010, // 10 fils per viewer (0.010 KWD)
        viewer_reward: 0.005,  // 5 fils to viewer (half of 10 fils)
        company_fee: 0.005,    // 5 fils to company (half of 10 fils)
        min_budget: 300.00,    // Starting at 300 KWD
        budget_increment: 100.00, // Increment by 100 KWD
        is_active: true
      },
      {
        name: '15 Second Package',
        duration: 15,
        price_per_view: 0.013, // 13 fils per viewer (0.013 KWD)
        viewer_reward: 0.0065, // 6.5 fils to viewer (half of 13 fils)
        company_fee: 0.0065,   // 6.5 fils to company (half of 13 fils)
        min_budget: 300.00,    // Starting at 300 KWD
        budget_increment: 100.00, // Increment by 100 KWD
        is_active: true
      },
      {
        name: '20 Second Package',
        duration: 20,
        price_per_view: 0.016, // 16 fils per viewer (0.016 KWD)
        viewer_reward: 0.008,  // 8 fils to viewer (half of 16 fils)
        company_fee: 0.008,    // 8 fils to company (half of 16 fils)
        min_budget: 300.00,    // Starting at 300 KWD
        budget_increment: 100.00, // Increment by 100 KWD
        is_active: true
      },
      {
        name: '30 Second Package',
        duration: 30,
        price_per_view: 0.024, // 24 fils per viewer (0.024 KWD)
        viewer_reward: 0.012,  // 12 fils to viewer (half of 24 fils)
        company_fee: 0.012,    // 12 fils to company (half of 24 fils)
        min_budget: 300.00,    // Starting at 300 KWD
        budget_increment: 100.00, // Increment by 100 KWD
        is_active: true
      }
    ];

    console.log('📦 Creating advertiser packages...');
    
    // Create all packages
    const createdPackages = await Promise.all(
      packages.map(pkg => AdvertiserPackage.create(pkg))
    );

    console.log('✅ All advertiser packages created successfully!');
    
    // Display created packages
    createdPackages.forEach(pkg => {
      console.log(`\n📦 Package: ${pkg.name}`);
      console.log(`   ⏱️ Duration: ${pkg.duration} seconds`);
      console.log(`   💰 Price per view: ${pkg.price_per_view} KWD (${(pkg.price_per_view * 1000).toFixed(0)} fils)`);
      console.log(`   🎁 Viewer reward: ${pkg.viewer_reward} KWD (${(pkg.viewer_reward * 1000).toFixed(0)} fils)`);
      console.log(`   🏢 Company fee: ${pkg.company_fee} KWD (${(pkg.company_fee * 1000).toFixed(0)} fils)`);
      console.log(`   💳 Min budget: ${pkg.min_budget} KWD`);
      console.log(`   📈 Budget increment: ${pkg.budget_increment} KWD`);
    });

    console.log('\n🎉 Advertiser packages injection completed successfully!');
    console.log('💡 Advertisers can now:');
    console.log('   - View available packages');
    console.log('   - Purchase packages with budgets starting at 300 KWD');
    console.log('   - Increment budgets by 100 KWD');
    console.log('   - Each view deducts the package price from their credit');
    console.log('   - Viewers earn half the package price as points');
    console.log('   - Company keeps the other half as fees');

  } catch (error) {
    console.error('❌ Error injecting advertiser packages:', error);
    console.error('📋 Error details:', error.message);

    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
  }
}

// Run the injection
if (require.main === module) {
  injectAdvertiserPackages()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { injectAdvertiserPackages };
