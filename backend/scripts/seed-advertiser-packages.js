// Seed Advertiser Packages with exact specifications
// This script creates the 4 required ad packages

const { sequelize, AdvertiserPackage } = require('../src/models');

async function seedAdvertiserPackages() {
  try {
    console.log('🚀 Starting advertiser packages seeding...');
    
    // Package specifications based on requirements
    const packages = [
      {
        name: 'P10 - 10 Seconds',
        duration: 10,
        price_per_view: 0.010, // 0.010 KWD (decimal)
        price_per_view_micro: 10_000, // 10,000 micro units
        viewer_reward: 0.005, // Half of 0.010 KWD
        company_fee: 0.005, // Half of 0.010 KWD
        min_budget: 300.00, // Starting budget
        budget_increment: 100.00, // Increment amount
        description: '10-second video ads at 10 fils per view. Starting budget: 300 KWD, increments of 100 KWD.',
        is_active: true
      },
      {
        name: 'P15 - 15 Seconds', 
        duration: 15,
        price_per_view: 0.013, // 0.013 KWD (decimal)
        price_per_view_micro: 13_000, // 13,000 micro units
        viewer_reward: 0.0065, // Half of 0.013 KWD
        company_fee: 0.0065, // Half of 0.013 KWD
        min_budget: 300.00, // Starting budget
        budget_increment: 100.00, // Increment amount
        description: '15-second video ads at 13 fils per view. Starting budget: 300 KWD, increments of 100 KWD.',
        is_active: true
      },
      {
        name: 'P20 - 20 Seconds',
        duration: 20,
        price_per_view: 0.016, // 0.016 KWD (decimal)
        price_per_view_micro: 16_000, // 16,000 micro units
        viewer_reward: 0.008, // Half of 0.016 KWD
        company_fee: 0.008, // Half of 0.016 KWD
        min_budget: 300.00, // Starting budget
        budget_increment: 100.00, // Increment amount
        description: '20-second video ads at 16 fils per view. Starting budget: 300 KWD, increments of 100 KWD.',
        is_active: true
      },
      {
        name: 'P30 - 30 Seconds',
        duration: 30,
        price_per_view: 0.024, // 0.024 KWD (decimal)
        price_per_view_micro: 24_000, // 24,000 micro units
        viewer_reward: 0.012, // Half of 0.024 KWD
        company_fee: 0.012, // Half of 0.024 KWD
        min_budget: 300.00, // Starting budget
        budget_increment: 100.00, // Increment amount
        description: '30-second video ads at 24 fils per view. Starting budget: 300 KWD, increments of 100 KWD.',
        is_active: true
      }
    ];

    console.log('📦 Creating packages...');
    
    for (const packageData of packages) {
      // Check if package already exists
      const existingPackage = await AdvertiserPackage.findOne({
        where: { duration: packageData.duration }
      });

      if (existingPackage) {
        console.log(`✅ Package ${packageData.name} already exists, updating...`);
        await existingPackage.update(packageData);
      } else {
        console.log(`✅ Creating package: ${packageData.name}`);
        await AdvertiserPackage.create(packageData);
      }
    }

    // Verify all packages were created
    const allPackages = await AdvertiserPackage.findAll({
      where: { is_active: true },
      order: [['duration', 'ASC']]
    });

    console.log('\n🎉 Advertiser packages seeding completed!');
    console.log('📊 Available packages:');
    
    allPackages.forEach(pkg => {
      const priceKWD = pkg.price_per_view_micro / 1_000_000;
      const viewerReward = Math.floor(pkg.price_per_view_micro / 2);
      const companyFee = pkg.price_per_view_micro - viewerReward;
      
      console.log(`   - ${pkg.name}`);
      console.log(`     Duration: ${pkg.duration}s`);
      console.log(`     Price/View: ${priceKWD.toFixed(3)} KWD (${pkg.price_per_view_micro.toLocaleString()} micro)`);
      console.log(`     Viewer Reward: ${(viewerReward / 1_000_000).toFixed(3)} KWD (${viewerReward.toLocaleString()} micro)`);
      console.log(`     Company Fee: ${(companyFee / 1_000_000).toFixed(3)} KWD (${companyFee.toLocaleString()} micro)`);
      console.log(`     Budget: 300 KWD + 100 KWD increments`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding packages:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
seedAdvertiserPackages();
