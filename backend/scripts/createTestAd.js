// Script to create a test ad using the new purchased package
const { Ad, AdvertiserPackage, PurchasedPackage, User, sequelize } = require('../src/models');

async function createTestAd() {
  try {
    console.log('🆕 CREATING TEST AD');
    console.log('=' .repeat(60));
    
    // Find the test advertiser
    const advertiser = await User.findOne({
      where: { phone: '+96550000000', role: 'advertiser' }
    });
    
    if (!advertiser) {
      console.log('❌ Test advertiser not found');
      return;
    }
    
    console.log(`Found advertiser: ${advertiser.name} (${advertiser.phone})`);
    
    // Find the active purchased package
    const purchasedPackage = await PurchasedPackage.findOne({
      where: { 
        advertiser_id: advertiser.id,
        status: 'active',
        is_active: true,
        remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 }
      },
      include: [
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view']
        }
      ],
      order: [['createdAt', 'DESC']] // Get the most recent one
    });
    
    if (!purchasedPackage) {
      console.log('❌ No active purchased package found');
      return;
    }
    
    console.log(`Found purchased package:`);
    console.log(`  ID: ${purchasedPackage.id}`);
    console.log(`  Package: ${purchasedPackage.package.name} (${purchasedPackage.package.duration}s)`);
    console.log(`  Price per view: ${purchasedPackage.package.price_per_view} fils`);
    console.log(`  Purchased budget: ${purchasedPackage.purchased_budget} KWD`);
    console.log(`  Remaining budget: ${purchasedPackage.remaining_budget} KWD`);
    
    // Create a test ad with 100 KWD budget
    const adBudget = 100; // KWD
    
    if (purchasedPackage.remaining_budget < adBudget) {
      console.log(`❌ Insufficient remaining budget. Need ${adBudget} KWD, have ${purchasedPackage.remaining_budget} KWD`);
      return;
    }
    
    console.log(`\nCreating test ad with ${adBudget} KWD budget...`);
    
    // Create the ad
    const testAd = await Ad.create({
      advertiserId: advertiser.id,
      packageId: purchasedPackage.package.id,
      purchased_package_id: purchasedPackage.id,
      title: 'Test Ad for Video Watching System',
      description: 'This is a test ad to verify the video watching and reward system works correctly. It has a 100 KWD budget and should allow multiple video views.',
      mediaUrl: 'https://example.com/test-video.mp4', // Placeholder URL
      section: 'technology', // Use an existing section
      budget: adBudget,
      remaining_budget: adBudget,
      spent: 0,
      views: 0,
      status: 'active',
      verification_status: 'approved',
      is_active: true,
      cta_enabled: true,
      cta_text: 'Learn More',
      cta_link: 'https://example.com'
    });
    
    console.log(`✅ Created test ad ID: ${testAd.id}`);
    console.log(`Title: "${testAd.title}"`);
    console.log(`Budget: ${testAd.budget} KWD`);
    console.log(`Status: ${testAd.status}`);
    console.log(`Verification: ${testAd.verification_status}`);
    
    // Update the purchased package budget
    const newRemainingBudget = purchasedPackage.remaining_budget - adBudget;
    const newUsedBudget = purchasedPackage.used_budget + adBudget;
    
    await purchasedPackage.update({
      remaining_budget: newRemainingBudget,
      used_budget: newUsedBudget,
      status: newRemainingBudget <= 0 ? 'used' : 'active'
    });
    
    console.log(`💰 Updated purchased package:`);
    console.log(`  Used budget: ${newUsedBudget} KWD`);
    console.log(`  Remaining budget: ${newRemainingBudget} KWD`);
    console.log(`  Status: ${newRemainingBudget <= 0 ? 'used' : 'active'}`);
    
    // Verify the creation
    const verification = await Ad.findByPk(testAd.id, {
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'purchased_budget', 'remaining_budget', 'used_budget', 'status']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view']
        }
      ]
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`Ad ID: ${verification.id}`);
    console.log(`Title: "${verification.title}"`);
    console.log(`Budget: ${verification.budget} KWD`);
    console.log(`Package: ${verification.package.name}`);
    console.log(`Purchased Package ID: ${verification.purchasedPackage.id}`);
    console.log(`Package Remaining Budget: ${verification.purchasedPackage.remaining_budget} KWD`);
    
    // Calculate how many views this ad can support
    const pricePerViewKWD = parseFloat(verification.package.price_per_view) / 1000;
    const maxViews = Math.floor(adBudget / pricePerViewKWD);
    
    console.log(`\n📊 View Capacity Analysis:`);
    console.log(`Price per view: ${pricePerViewKWD} KWD`);
    console.log(`Ad budget: ${adBudget} KWD`);
    console.log(`Maximum views possible: ${maxViews}`);
    console.log(`Viewer reward per view: ${pricePerViewKWD / 2} KWD`);
    console.log(`Company fee per view: ${pricePerViewKWD / 2} KWD`);
    
    console.log('\n🚀 Test ad creation complete!');
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Test video watching via the frontend`);
    console.log(`2. Verify reward distribution (50% viewer, 50% company)`);
    console.log(`3. Check budget deductions work correctly`);
    console.log(`4. Verify videos disappear after watching`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test ad:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestAd();
}
