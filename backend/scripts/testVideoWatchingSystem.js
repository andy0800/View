// Comprehensive test script to verify video watching system fixes
const { 
  Ad, 
  AdvertiserPackage, 
  PurchasedPackage, 
  User, 
  ViewEvent, 
  Wallet,
  CompanyWallet,
  Transaction,
  sequelize 
} = require('../src/models');

async function testVideoWatchingSystem() {
  try {
    console.log('🧪 TESTING VIDEO WATCHING SYSTEM FIXES');
    console.log('=' .repeat(60));
    
    // Test 1: Check current database state
    console.log('\n📊 Test 1: Current Database State');
    const totalAds = await Ad.count();
    const totalPurchasedPackages = await PurchasedPackage.count();
    const totalViewEvents = await ViewEvent.count();
    const totalWallets = await Wallet.count();
    const totalCompanyWallets = await CompanyWallet.count();
    
    console.log(`Total Ads: ${totalAds}`);
    console.log(`Total Purchased Packages: ${totalPurchasedPackages}`);
    console.log(`Total View Events: ${totalViewEvents}`);
    console.log(`Total Wallets: ${totalWallets}`);
    console.log(`Total Company Wallets: ${totalCompanyWallets}`);
    
    if (totalAds === 0) {
      console.log('⚠️  No ads found - cannot test video watching system');
      return;
    }
    
    // Test 2: Check ad with purchased package
    console.log('\n📊 Test 2: Ad with Purchased Package');
    const ad = await Ad.findOne({
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'purchased_budget', 'remaining_budget', 'used_budget', 'status']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view']
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'phone']
        }
      ],
      where: {
        status: 'active',
        verification_status: 'approved'
      },
      order: [['createdAt', 'DESC']] // Get the most recent ad
    });
    
    if (!ad) {
      console.log('⚠️  No ad found with purchased package');
      return;
    }
    
    console.log(`Ad ID: ${ad.id}`);
    console.log(`Title: ${ad.title}`);
    console.log(`Status: ${ad.status}`);
    console.log(`Verification: ${ad.verification_status}`);
    console.log(`Package: ${ad.package.name} (${ad.package.duration}s)`);
    console.log(`Package Price: ${ad.package.price_per_view} fils/view`);
    
    if (ad.purchasedPackage) {
      console.log(`Purchased Package ID: ${ad.purchasedPackage.id}`);
      console.log(`Purchased Budget: ${ad.purchasedPackage.purchased_budget} KWD`);
      console.log(`Used Budget: ${ad.purchasedPackage.used_budget} KWD`);
      console.log(`Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`Status: ${ad.purchasedPackage.status}`);
      
      // Test 3: Verify budget calculations
      console.log('\n📊 Test 3: Budget Calculations');
      const packagePricePerViewFils = parseFloat(ad.package.price_per_view);
      const packagePricePerViewKWD = packagePricePerViewFils / 1000;
      const viewerRewardKWD = packagePricePerViewKWD / 2;
      const companyFeeKWD = packagePricePerViewKWD / 2;
      const totalCostKWD = viewerRewardKWD + companyFeeKWD;
      
      console.log(`Package Price per View: ${packagePricePerViewFils} fils = ${packagePricePerViewKWD} KWD`);
      console.log(`Viewer Reward (50%): ${viewerRewardKWD} KWD`);
      console.log(`Company Fee (50%): ${companyFeeKWD} KWD`);
      console.log(`Total Cost: ${totalCostKWD} KWD`);
      
      // Test 4: Check if budget is sufficient
      console.log('\n📊 Test 4: Budget Sufficiency Check');
      const hasSufficientBudget = ad.purchasedPackage.remaining_budget >= totalCostKWD;
      console.log(`Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`Required for 1 view: ${totalCostKWD} KWD`);
      console.log(`Budget Sufficient: ${hasSufficientBudget ? '✅' : '❌'}`);
      
      if (!hasSufficientBudget) {
        console.log('⚠️  Ad has insufficient budget for viewing');
        return;
      }
      
      // Test 5: Check viewer wallets
      console.log('\n📊 Test 5: Viewer Wallets');
      const viewerWallets = await Wallet.findAll({
        where: { 
          user_id: { [sequelize.Sequelize.Op.ne]: ad.advertiserId } // Exclude advertiser
        },
        limit: 3
      });
      
      console.log(`Found ${viewerWallets.length} viewer wallets`);
      viewerWallets.forEach((wallet, index) => {
        console.log(`  Viewer ${index + 1}: Balance ${wallet.balance} fils (${wallet.balance / 1000} KWD)`);
      });
      
      // Test 6: Check company wallet
      console.log('\n📊 Test 6: Company Wallet');
      const companyWallet = await CompanyWallet.findOne({
        where: { company_name: 'View App Company' }
      });
      
      if (companyWallet) {
        console.log(`Company Wallet ID: ${companyWallet.id}`);
        console.log(`Balance: ${companyWallet.balance} fils (${companyWallet.balance / 1000} KWD)`);
        console.log(`Total Earnings: ${companyWallet.total_earnings} fils (${companyWallet.total_earnings / 1000} KWD)`);
        console.log(`Total Video Views: ${companyWallet.total_video_views}`);
      } else {
        console.log('⚠️  Company wallet not found');
      }
      
      // Test 7: Check advertiser wallet
      console.log('\n📊 Test 7: Advertiser Wallet');
      const advertiserWallet = await Wallet.findOne({
        where: { user_id: ad.advertiserId }
      });
      
      if (advertiserWallet) {
        console.log(`Advertiser Wallet ID: ${advertiserWallet.id}`);
        console.log(`Balance: ${advertiserWallet.balance} fils (${advertiserWallet.balance / 1000} KWD)`);
      } else {
        console.log('⚠️  Advertiser wallet not found');
      }
      
      // Test 8: Simulate video completion
      console.log('\n📊 Test 8: Simulate Video Completion');
      console.log('This would test the completeWatchingAd function');
      console.log('Expected results:');
      console.log('  - Viewer wallet balance increases by viewerRewardKWD');
      console.log('  - Company wallet balance increases by companyFeeKWD');
      console.log('  - Advertiser wallet balance decreases by totalCostKWD');
      console.log('  - Purchased package remaining_budget decreases by totalCostKWD');
      console.log('  - ViewEvent is created with completion data');
      console.log('  - Ad views count increases by 1');
      console.log('  - Ad spent amount increases by totalCostKWD');
      
      // Test 9: Check video filtering logic
      console.log('\n📊 Test 9: Video Filtering Logic');
      console.log('The system should:');
      console.log('  - Filter out videos with insufficient budget');
      console.log('  - Filter out already watched videos');
      console.log('  - Only show videos with active purchased packages');
      
      // Test 10: Check reward system
      console.log('\n📊 Test 10: Reward System');
      console.log('According to app logic:');
      console.log('  - 10s package: 10 fils/view (5 fils to viewer, 5 fils to company)');
      console.log('  - 15s package: 13 fils/view (6.5 fils to viewer, 6.5 fils to company)');
      console.log('  - 20s package: 16 fils/view (8 fils to viewer, 8 fils to company)');
      console.log('  - 30s package: 24 fils/view (12 fils to viewer, 12 fils to company)');
      
      console.log(`Current package: ${ad.package.name} (${ad.package.duration}s)`);
      console.log(`Expected viewer reward: ${viewerRewardKWD} KWD`);
      console.log(`Expected company fee: ${companyFeeKWD} KWD`);
      
    } else {
      console.log('⚠️  Ad has no purchased package - this is an issue');
    }
    
    console.log('\n✅ Video watching system test complete!');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test actual video completion via API');
    console.log('2. Verify wallet balances update correctly');
    console.log('3. Check that videos disappear after watching');
    console.log('4. Verify budget deductions work properly');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing video watching system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testVideoWatchingSystem();
}
