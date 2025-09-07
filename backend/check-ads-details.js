require('dotenv').config();
const { sequelize, Ad, AdvertiserPackage, PurchasedPackage } = require('./src/models');

async function checkAdsDetails() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check ads with all details
    const ads = await Ad.findAll({
      where: { status: 'active', is_active: true },
      include: [
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'price_per_view', 'viewer_reward', 'duration']
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'remaining_budget', 'remaining_micro', 'status']
        }
      ]
    });

    console.log(`\n📹 Active ads found: ${ads.length}`);
    ads.forEach((ad, index) => {
      console.log(`\n--- Ad ${index + 1} ---`);
      console.log(`   ID: ${ad.id}`);
      console.log(`   Title: ${ad.title}`);
      console.log(`   Status: ${ad.status}`);
      console.log(`   Active: ${ad.is_active}`);
      console.log(`   Advertiser ID: ${ad.advertiserId}`);
      console.log(`   Package ID: ${ad.packageId}`);
      console.log(`   Purchased Package ID: ${ad.purchased_package_id}`);
      console.log(`   Section: ${ad.section}`);
      console.log(`   Budget: ${ad.budget}`);
      console.log(`   Remaining Budget: ${ad.remaining_budget}`);
      
      if (ad.package) {
        console.log(`   Package: ${ad.package.name}`);
        console.log(`   Price per View: ${ad.package.price_per_view}`);
        console.log(`   Viewer Reward: ${ad.package.viewer_reward}`);
        console.log(`   Duration: ${ad.package.duration}`);
      }
      
      if (ad.purchasedPackage) {
        console.log(`   Purchased Package Status: ${ad.purchasedPackage.status}`);
        console.log(`   Remaining Budget: ${ad.purchasedPackage.remaining_budget}`);
        console.log(`   Remaining Micro: ${ad.purchasedPackage.remaining_micro}`);
      }
    });

    // Check if ads have required fields for viewer visibility
    console.log('\n🔍 CHECKING AD VISIBILITY REQUIREMENTS:');
    ads.forEach((ad, index) => {
      const issues = [];
      
      if (!ad.purchased_package_id) issues.push('Missing purchased_package_id');
      if (!ad.section) issues.push('Missing section');
      if (!ad.budget || ad.budget <= 0) issues.push('Invalid budget');
      if (!ad.remaining_budget || ad.remaining_budget <= 0) issues.push('Invalid remaining_budget');
      if (!ad.package) issues.push('Missing package association');
      if (!ad.purchasedPackage) issues.push('Missing purchased package association');
      if (ad.purchasedPackage && ad.purchasedPackage.status !== 'active') issues.push('Purchased package not active');
      if (ad.purchasedPackage && ad.purchasedPackage.remaining_budget <= 0) issues.push('Purchased package has no budget');
      
      if (issues.length > 0) {
        console.log(`   Ad ${index + 1}: ❌ ${issues.join(', ')}`);
      } else {
        console.log(`   Ad ${index + 1}: ✅ All requirements met`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAdsDetails();
