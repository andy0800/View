// Test the ad filtering logic to see if ads show up now
const { Ad, AdvertiserPackage, PurchasedPackage, User } = require('../src/models');
const { Op, fn } = require('sequelize');

async function testAdFiltering() {
  try {
    console.log('🔍 TESTING AD FILTERING LOGIC\n');

    // Simulate the getAllAdsRandomly filtering logic
    const ads = await Ad.findAll({
      where: {
        status: 'active',
        is_active: true,
        verification_status: 'approved', // Only return verified ads
        purchased_package_id: { [Op.ne]: null } // Must have a purchased package
      },
      include: [
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view', 'viewer_reward', 'company_fee']
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['name', 'company_name']
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'remaining_budget', 'used_budget', 'status']
        }
      ],
      order: [[fn('RANDOM')]], // Random ordering
      limit: 20
    });

    console.log(`📦 Found ${ads.length} active, approved ads before budget filtering\n`);

    // Apply budget filtering logic (FIXED VERSION)
    const adsWithBudget = ads.filter(ad => {
      if (!ad.purchased_package_id) return false;
      
      // Get the purchased package to check budget
      const purchasedPackage = ad.purchasedPackage;
      if (!purchasedPackage) return false;
      
      // Check if package has remaining budget
      const packagePricePerView = ad.package?.price_per_view || 0;
      // FIXED: price_per_view is already in KWD, no need to divide by 1000
      const pricePerViewKWD = packagePricePerView;
      const hasBudget = purchasedPackage.remaining_budget >= pricePerViewKWD;
      
      console.log(`📊 Ad: ${ad.title}`);
      console.log(`   Package remaining: ${purchasedPackage.remaining_budget} KWD`);
      console.log(`   Price per view: ${pricePerViewKWD} KWD`);
      console.log(`   Has budget: ${hasBudget ? '✅ YES' : '❌ NO'}`);
      console.log('');
      
      return hasBudget;
    });

    console.log(`🎯 RESULT: ${adsWithBudget.length} ads pass the budget filter`);
    
    if (adsWithBudget.length > 0) {
      console.log('\n✅ ADS THAT WILL SHOW TO VIEWERS:');
      adsWithBudget.forEach(ad => {
        console.log(`- ${ad.title} (${ad.purchasedPackage.remaining_budget} KWD available)`);
      });
    } else {
      console.log('\n❌ NO ADS WILL SHOW TO VIEWERS');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing ad filtering:', error);
    process.exit(1);
  }
}

testAdFiltering();
