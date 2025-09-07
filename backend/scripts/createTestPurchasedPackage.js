// Script to create a new test purchased package for video watching testing
const { AdvertiserPackage, PurchasedPackage, User, Wallet, sequelize } = require('../src/models');

async function createTestPurchasedPackage() {
  try {
    console.log('🆕 CREATING TEST PURCHASED PACKAGE');
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
    
    // Find an available advertiser package
    const package = await AdvertiserPackage.findOne({
      where: { is_active: true },
      order: [['duration', 'ASC']]
    });
    
    if (!package) {
      console.log('❌ No active advertiser packages found');
      return;
    }
    
    console.log(`Selected package: ${package.name} (${package.duration}s)`);
    console.log(`Price per view: ${package.price_per_view} fils`);
    
    // Check advertiser wallet balance
    const advertiserWallet = await Wallet.findOne({
      where: { user_id: advertiser.id }
    });
    
    if (!advertiserWallet) {
      console.log('❌ Advertiser wallet not found');
      return;
    }
    
    const walletBalance = parseFloat(advertiserWallet.balance) / 1000; // Convert from fils to KWD
    console.log(`Advertiser wallet balance: ${walletBalance} KWD`);
    
    // Create a new purchased package with 500 KWD budget
    const newBudget = 500; // KWD
    
    if (walletBalance < newBudget) {
      console.log(`❌ Insufficient wallet balance. Need ${newBudget} KWD, have ${walletBalance} KWD`);
      return;
    }
    
    console.log(`\nCreating purchased package with ${newBudget} KWD budget...`);
    
    // Create the purchased package
    const newPurchasedPackage = await PurchasedPackage.create({
      advertiser_id: advertiser.id,
      package_id: package.id,
      purchased_budget: newBudget,
      remaining_budget: newBudget,
      used_budget: 0,
      status: 'active',
      is_active: true,
      estimated_views: Math.floor(newBudget / (parseFloat(package.price_per_view) / 1000))
    });
    
    console.log(`✅ Created purchased package ID: ${newPurchasedPackage.id}`);
    console.log(`Budget: ${newPurchasedPackage.purchased_budget} KWD`);
    console.log(`Remaining: ${newPurchasedPackage.remaining_budget} KWD`);
    console.log(`Estimated views: ${newPurchasedPackage.estimated_views}`);
    
    // Deduct from advertiser wallet
    const newWalletBalance = walletBalance - newBudget;
    await advertiserWallet.update({
      balance: newWalletBalance * 1000 // Convert back to fils
    });
    
    console.log(`💰 Updated advertiser wallet balance: ${newWalletBalance} KWD`);
    
    // Verify the creation
    const verification = await PurchasedPackage.findByPk(newPurchasedPackage.id, {
      include: [
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view']
        }
      ]
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`Package: ${verification.package.name}`);
    console.log(`Budget: ${verification.purchased_budget} KWD`);
    console.log(`Status: ${verification.status}`);
    console.log(`Is Active: ${verification.is_active}`);
    
    console.log('\n🚀 Test purchased package creation complete!');
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Create a new ad using this purchased package`);
    console.log(`2. Test video watching and reward system`);
    console.log(`3. Verify budget deductions work correctly`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test purchased package:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestPurchasedPackage();
}
