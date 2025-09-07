// Simple test to check video filtering
const { Ad, User, AdvertiserPackage, PurchasedPackage } = require('../src/models');
const { Op } = require('sequelize');

async function testVideoFiltering() {
  try {
    console.log('🔍 Testing video filtering logic...\n');

    // Test 1: Check all ads
    const allAds = await Ad.findAll({
      attributes: ['id', 'title', 'section', 'status', 'verification_status', 'is_active', 'mediaUrl']
    });

    console.log(`📊 Total ads in database: ${allAds.length}`);
    allAds.forEach(ad => {
      console.log(`  - ${ad.title} (${ad.section}): status=${ad.status}, verification=${ad.verification_status}, active=${ad.is_active}`);
    });

    // Test 2: Check ads with specific criteria
    const testSection = 'restaurants'; // Test with a specific section
    
    const videos = await Ad.findAll({
      where: {
        section: testSection,
        status: 'active',
        is_active: true,
        verification_status: 'approved',
        purchased_package_id: { [Op.ne]: null }
      },
      include: [
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'company_name']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view']
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'remaining_budget', 'used_budget', 'status']
        }
      ]
    });

    console.log(`\n🔍 Videos found for section '${testSection}': ${videos.length}`);
    
    if (videos.length > 0) {
      videos.forEach(video => {
        console.log(`  - ${video.title}: budget=${video.purchasedPackage?.remaining_budget} KWD`);
      });
    } else {
      console.log('❌ No videos found. Checking each filter condition...');
      
      // Check each condition separately
      const adsInSection = await Ad.count({ where: { section: testSection } });
      console.log(`  - Ads in section '${testSection}': ${adsInSection}`);
      
      const activeAds = await Ad.count({ where: { status: 'active' } });
      console.log(`  - Ads with status 'active': ${activeAds}`);
      
      const verifiedAds = await Ad.count({ where: { verification_status: 'approved' } });
      console.log(`  - Ads with verification_status 'approved': ${verifiedAds}`);
      
      const activeAds2 = await Ad.count({ where: { is_active: true } });
      console.log(`  - Ads with is_active true: ${activeAds2}`);
      
      const adsWithPackage = await Ad.count({ where: { purchased_package_id: { [Op.ne]: null } } });
      console.log(`  - Ads with purchased package: ${adsWithPackage}`);
    }

  } catch (error) {
    console.error('❌ Error testing video filtering:', error);
  } finally {
    process.exit(0);
  }
}

testVideoFiltering();
