// Seed Advertiser Packages using direct SQL
// This script creates the 4 required ad packages bypassing Sequelize model issues

const { sequelize } = require('../src/models');

async function seedAdvertiserPackagesDirect() {
  try {
    console.log('🚀 Starting advertiser packages seeding (direct SQL)...');
    
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
        description: '10-second video ads at 10 fils per view. Starting budget: 300 KWD, increments of 100 KWD.'
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
        description: '15-second video ads at 13 fils per view. Starting budget: 300 KWD, increments of 100 KWD.'
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
        description: '20-second video ads at 16 fils per view. Starting budget: 300 KWD, increments of 100 KWD.'
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
        description: '30-second video ads at 24 fils per view. Starting budget: 300 KWD, increments of 100 KWD.'
      }
    ];

    console.log('📦 Creating packages using direct SQL...');
    
    for (const packageData of packages) {
      // Check if package already exists
      const existingPackages = await sequelize.query(
        'SELECT id FROM advertiser_packages WHERE duration = :duration',
        {
          replacements: { duration: packageData.duration },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (existingPackages.length > 0) {
        console.log(`✅ Package ${packageData.name} already exists, updating...`);
        await sequelize.query(`
          UPDATE advertiser_packages 
          SET 
            name = :name,
            price_per_view = :price_per_view,
            price_per_view_micro = :price_per_view_micro,
            viewer_reward = :viewer_reward,
            company_fee = :company_fee,
            min_budget = :min_budget,
            budget_increment = :budget_increment,
            description = :description,
            is_active = true,
            updated_at = NOW()
          WHERE duration = :duration
        `, {
          replacements: {
            name: packageData.name,
            price_per_view: packageData.price_per_view,
            price_per_view_micro: packageData.price_per_view_micro,
            viewer_reward: packageData.viewer_reward,
            company_fee: packageData.company_fee,
            min_budget: packageData.min_budget,
            budget_increment: packageData.budget_increment,
            description: packageData.description,
            duration: packageData.duration
          }
        });
      } else {
        console.log(`✅ Creating package: ${packageData.name}`);
        await sequelize.query(`
          INSERT INTO advertiser_packages (
            name, duration, price_per_view, price_per_view_micro,
            viewer_reward, company_fee, min_budget, budget_increment,
            description, is_active, created_at, updated_at
          ) VALUES (
            :name, :duration, :price_per_view, :price_per_view_micro,
            :viewer_reward, :company_fee, :min_budget, :budget_increment,
            :description, true, NOW(), NOW()
          )
        `, {
          replacements: {
            name: packageData.name,
            duration: packageData.duration,
            price_per_view: packageData.price_per_view,
            price_per_view_micro: packageData.price_per_view_micro,
            viewer_reward: packageData.viewer_reward,
            company_fee: packageData.company_fee,
            min_budget: packageData.min_budget,
            budget_increment: packageData.budget_increment,
            description: packageData.description
          }
        });
      }
    }

    // Verify all packages were created
    const allPackages = await sequelize.query(
      'SELECT * FROM advertiser_packages WHERE is_active = true ORDER BY duration ASC',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('\n🎉 Advertiser packages seeding completed!');
    console.log('📊 Available packages:');
    
    allPackages.forEach(pkg => {
      const priceKWD = pkg.price_per_view;
      const viewerReward = pkg.viewer_reward;
      const companyFee = pkg.company_fee;
      
      console.log(`   - ${pkg.name}`);
      console.log(`     Duration: ${pkg.duration}s`);
      console.log(`     Price/View: ${priceKWD} KWD (${pkg.price_per_view_micro.toLocaleString()} micro)`);
      console.log(`     Viewer Reward: ${viewerReward} KWD`);
      console.log(`     Company Fee: ${companyFee} KWD`);
      console.log(`     Budget: ${pkg.min_budget} KWD + ${pkg.budget_increment} KWD increments`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding packages:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
seedAdvertiserPackagesDirect();
