const { 
  User, 
  AdvertiserPackage, 
  PurchasedPackage, 
  Ad, 
  Wallet,
  sequelize 
} = require('../src/models');

async function createTestAdForViewer() {
  console.log('🔧 CREATING TEST AD FOR VIEWER INTERFACE\n');
  
  try {
    // Find an advertiser user
    console.log('1️⃣ Finding advertiser user...');
    const advertiser = await User.findOne({ 
      where: { role: 'advertiser' },
      include: [{ model: Wallet, as: 'wallet' }]
    });
    
    if (!advertiser) {
      console.log('❌ No advertiser user found');
      return;
    }
    
    console.log(`✅ Found advertiser: ${advertiser.email}`);
    console.log(`   - Wallet balance: ${advertiser.wallet?.balance || 0} fils`);
    
    // Find an available package
    console.log('\n2️⃣ Finding available package...');
    const package = await AdvertiserPackage.findOne({
      where: { name: '10 Second Package' }
    });
    
    if (!package) {
      console.log('❌ No 10 Second Package found');
      return;
    }
    
    console.log(`✅ Found package: ${package.name}`);
    console.log(`   - Price per view: ${package.price_per_view} KWD`);
    console.log(`   - Duration: ${package.duration} seconds`);
    
    // Check if advertiser has enough balance
    const requiredBudget = 100; // 100 KWD for testing
    const requiredBalance = requiredBudget * 1000; // Convert to fils
    
    if ((advertiser.wallet?.balance || 0) < requiredBalance) {
      console.log(`❌ Insufficient balance. Need ${requiredBalance} fils, have ${advertiser.wallet?.balance || 0} fils`);
      console.log('   - Adding test balance...');
      
      await advertiser.wallet.update({
        balance: requiredBalance + (advertiser.wallet.balance || 0)
      });
      
      console.log(`   ✅ Updated balance to ${advertiser.wallet.balance} fils`);
    }
    
    // Create a new purchased package
    console.log('\n3️⃣ Creating new purchased package...');
    const estimatedViews = Math.floor(requiredBudget / parseFloat(package.price_per_view));
    const purchasedPackage = await PurchasedPackage.create({
      advertiser_id: advertiser.id,
      package_id: package.id,
      purchased_budget: requiredBudget,
      remaining_budget: requiredBudget,
      used_budget: 0,
      estimated_views: estimatedViews,
      status: 'active'
    });
    
    console.log(`✅ Created purchased package with ${requiredBudget} KWD budget`);
    
    // Deduct from advertiser wallet
    const newBalance = advertiser.wallet.balance - requiredBalance;
    await advertiser.wallet.update({ balance: newBalance });
    console.log(`✅ Deducted ${requiredBalance} fils from advertiser wallet`);
    
    // Create a test ad
    console.log('\n4️⃣ Creating test ad...');
    const testAd = await Ad.create({
      advertiserId: advertiser.id,
      title: 'Test Ad for Viewer Interface',
      description: 'This is a test ad to ensure the viewer interface works properly',
      mediaUrl: 'https://example.com/test-video.mp4',
      mediaType: 'video',
      duration: package.duration,
      budget: 50, // 50 KWD budget for this ad
      remainingBudget: 50,
      spent: 0,
      views: 0,
      section: 'technology',
      status: 'active',
      isActive: true,
      verificationStatus: 'approved',
      purchasedPackageId: purchasedPackage.id,
      packageId: package.id,
      ctaText: 'Learn More',
      ctaLink: 'https://example.com',
      ctaEnabled: true
    });
    
    console.log(`✅ Created test ad: ${testAd.title}`);
    console.log(`   - Budget: ${testAd.budget} KWD`);
    console.log(`   - Section: ${testAd.section}`);
    console.log(`   - Status: ${testAd.status}`);
    
    // Update purchased package to reflect ad budget allocation
    const newRemainingBudget = requiredBudget - testAd.budget;
    await purchasedPackage.update({
      remaining_budget: newRemainingBudget,
      used_budget: testAd.budget
    });
    
    console.log(`✅ Updated purchased package budget allocation`);
    console.log(`   - Remaining: ${newRemainingBudget} KWD`);
    console.log(`   - Used: ${testAd.budget} KWD`);
    
    console.log('\n🎯 TEST AD CREATED SUCCESSFULLY!');
    console.log('The viewer interface should now have content to display.');
    
  } catch (error) {
    console.error('❌ Error creating test ad:', error);
    throw error;
  }
}

if (require.main === module) {
  createTestAdForViewer().then(() => {
    console.log('\n🎯 Test ad creation completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Test ad creation failed:', error);
    process.exit(1);
  });
}

module.exports = { createTestAdForViewer };
