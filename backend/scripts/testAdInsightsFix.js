// Test script to verify ad insights fixes work correctly
const { 
  Ad, 
  AdvertiserPackage, 
  PurchasedPackage, 
  User, 
  sequelize 
} = require('../src/models');

async function testAdInsightsFix() {
  try {
    console.log('🧪 TESTING AD INSIGHTS FIXES');
    console.log('=' .repeat(50));
    
    // Test 1: Check current database state
    console.log('\n📊 Test 1: Current Database State');
    const totalAds = await Ad.count();
    const totalPurchasedPackages = await PurchasedPackage.count();
    
    console.log(`Total Ads: ${totalAds}`);
    console.log(`Total Purchased Packages: ${totalPurchasedPackages}`);
    
    if (totalAds === 0) {
      console.log('⚠️  No ads found - cannot test insights');
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
        }
      ]
    });
    
    if (!ad) {
      console.log('⚠️  No ad found with purchased package');
      return;
    }
    
    console.log(`Ad ID: ${ad.id}`);
    console.log(`Title: ${ad.title}`);
    console.log(`Budget: ${ad.budget} KWD`);
    console.log(`Package: ${ad.package.name} (${ad.package.duration}s)`);
    console.log(`Package Price: ${ad.package.price_per_view} fils/view`);
    
    if (ad.purchasedPackage) {
      console.log(`Purchased Package ID: ${ad.purchasedPackage.id}`);
      console.log(`Purchased Budget: ${ad.purchasedPackage.purchased_budget} KWD`);
      console.log(`Used Budget: ${ad.purchasedPackage.used_budget} KWD`);
      console.log(`Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`Status: ${ad.purchasedPackage.status}`);
      
      // Test 3: Verify budget consistency
      console.log('\n📊 Test 3: Budget Consistency Check');
      const adBudget = parseFloat(ad.budget) || 0;
      const purchasedBudget = parseFloat(ad.purchasedPackage.purchased_budget) || 0;
      const usedBudget = parseFloat(ad.purchasedPackage.used_budget) || 0;
      const remainingBudget = parseFloat(ad.purchasedPackage.remaining_budget) || 0;
      
      const expectedUsedBudget = adBudget;
      const expectedRemainingBudget = purchasedBudget - adBudget;
      
      const usedBudgetMatch = Math.abs(usedBudget - expectedUsedBudget) < 0.01;
      const remainingBudgetMatch = Math.abs(remainingBudget - expectedRemainingBudget) < 0.01;
      
      console.log(`Ad Budget: ${adBudget} KWD`);
      console.log(`Purchased Budget: ${purchasedBudget} KWD`);
      console.log(`Expected Used Budget: ${expectedUsedBudget} KWD`);
      console.log(`Actual Used Budget: ${usedBudget} KWD`);
      console.log(`Used Budget Match: ${usedBudgetMatch ? '✅' : '❌'}`);
      
      console.log(`Expected Remaining Budget: ${expectedRemainingBudget} KWD`);
      console.log(`Actual Remaining Budget: ${remainingBudget} KWD`);
      console.log(`Remaining Budget Match: ${remainingBudgetMatch ? '✅' : '❌'}`);
      
      if (!usedBudgetMatch || !remainingBudgetMatch) {
        console.log('\n⚠️  Budget inconsistency detected!');
        console.log('Running fix script...');
        
        // Import and run the fix function
        const { fixBudgetInconsistencies } = require('./fixBudgetInconsistencies');
        await fixBudgetInconsistencies();
        
        // Re-check after fix
        console.log('\n🔍 Re-checking after fix...');
        await ad.reload({
          include: [
            {
              model: PurchasedPackage,
              as: 'purchasedPackage'
            }
          ]
        });
        
        const newUsedBudget = parseFloat(ad.purchasedPackage.used_budget) || 0;
        const newRemainingBudget = parseFloat(ad.purchasedPackage.remaining_budget) || 0;
        
        console.log(`New Used Budget: ${newUsedBudget} KWD`);
        console.log(`New Remaining Budget: ${newRemainingBudget} KWD`);
        
        const newUsedBudgetMatch = Math.abs(newUsedBudget - expectedUsedBudget) < 0.01;
        const newRemainingBudgetMatch = Math.abs(newRemainingBudget - expectedRemainingBudget) < 0.01;
        
        console.log(`Fixed Used Budget Match: ${newUsedBudgetMatch ? '✅' : '❌'}`);
        console.log(`Fixed Remaining Budget Match: ${newRemainingBudgetMatch ? '✅' : '❌'}`);
      }
      
      // Test 4: Calculate expected insights data
      console.log('\n📊 Test 4: Expected Insights Data');
      const packagePricePerViewKWD = (parseFloat(ad.package.price_per_view) || 0) / 1000;
      const estimatedRemainingViews = packagePricePerViewKWD > 0 ? Math.floor(remainingBudget / packagePricePerViewKWD) : 0;
      const budgetUsage = purchasedBudget > 0 ? ((purchasedBudget - remainingBudget) / purchasedBudget) * 100 : 0;
      
      console.log(`Package Price per View: ${packagePricePerViewKWD.toFixed(6)} KWD`);
      console.log(`Estimated Remaining Views: ${estimatedRemainingViews}`);
      console.log(`Budget Usage: ${budgetUsage.toFixed(1)}%`);
      
      // Test 5: Simulate API response
      console.log('\n📊 Test 5: Simulated API Response');
      const simulatedResponse = {
        ad: {
          id: ad.id,
          title: ad.title,
          status: ad.status,
          verification_status: ad.verification_status,
          budget: ad.budget,
          remaining_budget: ad.remaining_budget,
          spent: ad.spent || 0,
          views: ad.views || 0,
          cost_per_view: 0, // Will be calculated when views > 0
          estimated_remaining_views: estimatedRemainingViews,
          budget_usage_percentage: Math.round(budgetUsage * 100) / 100,
          package: {
            name: ad.package.name,
            duration: ad.package.duration,
            price_per_view: ad.package.price_per_view
          },
          purchased_package: {
            purchased_budget: ad.purchasedPackage.purchased_budget,
            remaining_budget: ad.purchasedPackage.remaining_budget,
            used_budget: ad.purchasedPackage.used_budget,
            estimated_views: ad.purchasedPackage.estimated_views
          }
        }
      };
      
      console.log('Simulated API Response:');
      console.log(JSON.stringify(simulatedResponse, null, 2));
      
    } else {
      console.log('⚠️  Ad has no purchased package - this is an issue');
    }
    
    console.log('\n✅ Ad insights fix test complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing ad insights fix:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testAdInsightsFix();
}
