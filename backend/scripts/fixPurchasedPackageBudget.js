// Script to fix purchased package budget issues
const { Ad, AdvertiserPackage, PurchasedPackage, User, sequelize } = require('../src/models');

async function fixPurchasedPackageBudget() {
  try {
    console.log('🔧 FIXING PURCHASED PACKAGE BUDGET ISSUES');
    console.log('=' .repeat(60));
    
    // Check the current state
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
      console.log('⚠️  No ad found');
      return;
    }
    
    console.log(`Ad ID: ${ad.id}`);
    console.log(`Title: ${ad.title}`);
    console.log(`Budget: ${ad.budget} KWD`);
    
    if (ad.purchasedPackage) {
      console.log(`\nCurrent Purchased Package State:`);
      console.log(`Purchased Budget: ${ad.purchasedPackage.purchased_budget} KWD`);
      console.log(`Used Budget: ${ad.purchasedPackage.used_budget} KWD`);
      console.log(`Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`Status: ${ad.purchasedPackage.status}`);
      
      // The issue: remaining_budget is 0 but ad.budget should be deducted from it
      const adBudget = parseFloat(ad.budget) || 0;
      const purchasedBudget = parseFloat(ad.purchasedPackage.purchased_budget) || 0;
      
      console.log(`\nAd Budget: ${adBudget} KWD`);
      console.log(`Purchased Budget: ${purchasedBudget} KWD`);
      
      // Calculate correct values
      const correctUsedBudget = adBudget;
      const correctRemainingBudget = purchasedBudget - adBudget;
      
      console.log(`\nCorrect Values:`);
      console.log(`Used Budget should be: ${correctUsedBudget} KWD`);
      console.log(`Remaining Budget should be: ${correctRemainingBudget} KWD`);
      
      if (correctRemainingBudget < 0) {
        console.log(`\n⚠️  WARNING: Ad budget (${adBudget} KWD) exceeds purchased budget (${purchasedBudget} KWD)`);
        console.log('This suggests the ad was created with a budget larger than the package allows');
        
        // Fix by setting used_budget to purchased_budget and remaining to 0
        const fixedUsedBudget = purchasedBudget;
        const fixedRemainingBudget = 0;
        
        console.log(`\nFixing to:`);
        console.log(`Used Budget: ${fixedUsedBudget} KWD`);
        console.log(`Remaining Budget: ${fixedRemainingBudget} KWD`);
        
        await ad.purchasedPackage.update({
          used_budget: fixedUsedBudget,
          remaining_budget: fixedRemainingBudget,
          status: 'used'
        });
        
        console.log('✅ Fixed! Package marked as fully used');
        
      } else {
        // Normal case: fix the budget allocation
        console.log(`\nFixing budget allocation...`);
        
        await ad.purchasedPackage.update({
          used_budget: correctUsedBudget,
          remaining_budget: correctRemainingBudget,
          status: correctRemainingBudget <= 0 ? 'used' : 'active'
        });
        
        console.log('✅ Fixed! Budget allocation corrected');
      }
      
      // Verify the fix
      await ad.purchasedPackage.reload();
      console.log(`\nVerification:`);
      console.log(`Used Budget: ${ad.purchasedPackage.used_budget} KWD`);
      console.log(`Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`Status: ${ad.purchasedPackage.status}`);
      
    } else {
      console.log('⚠️  Ad has no purchased package');
    }
    
    console.log('\n🚀 Purchased package budget fix complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing purchased package budget:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixPurchasedPackageBudget();
}
