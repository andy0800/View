// Script to analyze the ad budget issue
const { Ad, AdvertiserPackage, PurchasedPackage, User, sequelize } = require('../src/models');

async function analyzeAdBudgetIssue() {
  try {
    console.log('🔍 ANALYZING AD BUDGET ISSUE');
    console.log('=' .repeat(60));
    
    // Check the ad details
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
          attributes: ['id', 'name', 'duration', 'price_per_view', 'min_budget', 'budget_increment']
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });
    
    if (!ad) {
      console.log('⚠️  No ad found');
      return;
    }
    
    console.log(`Ad Details:`);
    console.log(`ID: ${ad.id}`);
    console.log(`Title: ${ad.title}`);
    console.log(`Budget: ${ad.budget} KWD`);
    console.log(`Budget Type: ${typeof ad.budget}`);
    console.log(`Raw Budget Value: ${JSON.stringify(ad.budget)}`);
    
    if (ad.purchasedPackage) {
      console.log(`\nPurchased Package Details:`);
      console.log(`ID: ${ad.purchasedPackage.id}`);
      console.log(`Purchased Budget: ${ad.purchasedPackage.purchased_budget} KWD`);
      console.log(`Used Budget: ${ad.purchasedPackage.used_budget} KWD`);
      console.log(`Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`Status: ${ad.purchasedPackage.status}`);
    }
    
    if (ad.package) {
      console.log(`\nAdvertiser Package Details:`);
      console.log(`ID: ${ad.package.id}`);
      console.log(`Name: ${ad.package.name}`);
      console.log(`Duration: ${ad.package.duration}s`);
      console.log(`Price per View: ${ad.package.price_per_view} fils`);
      console.log(`Min Budget: ${ad.package.min_budget} KWD`);
      console.log(`Budget Increment: ${ad.package.budget_increment} KWD`);
    }
    
    // Check if this is a data type issue
    console.log(`\nData Type Analysis:`);
    console.log(`Ad Budget (raw): ${ad.budget}`);
    console.log(`Ad Budget (parsed): ${parseFloat(ad.budget)}`);
    console.log(`Ad Budget (as integer): ${parseInt(ad.budget)}`);
    
    // Check if this might be a currency conversion issue
    const budgetInFils = parseFloat(ad.budget) * 1000;
    const budgetInKWD = parseFloat(ad.budget) / 1000;
    
    console.log(`\nCurrency Conversion Analysis:`);
    console.log(`If budget is in fils: ${budgetInFils} fils`);
    console.log(`If budget is in KWD: ${budgetInKWD} KWD`);
    
    // Check what the budget should be based on the package
    if (ad.package && ad.purchasedPackage) {
      const packagePricePerViewFils = parseFloat(ad.package.price_per_view);
      const packagePricePerViewKWD = packagePricePerViewFils / 1000;
      const purchasedBudget = parseFloat(ad.purchasedPackage.purchased_budget);
      
      console.log(`\nExpected Budget Analysis:`);
      console.log(`Package Price per View: ${packagePricePerViewKWD} KWD`);
      console.log(`Purchased Budget: ${purchasedBudget} KWD`);
      console.log(`Max Views Possible: ${Math.floor(purchasedBudget / packagePricePerViewKWD)}`);
      
      // Check if the ad budget should actually be the purchased budget
      if (Math.abs(parseFloat(ad.budget) - purchasedBudget) < 0.01) {
        console.log(`✅ Ad budget matches purchased budget - this is correct`);
      } else if (Math.abs(parseFloat(ad.budget) - purchasedBudget * 1000) < 0.01) {
        console.log(`⚠️  Ad budget appears to be in fils instead of KWD`);
        console.log(`Expected: ${purchasedBudget} KWD, Actual: ${parseFloat(ad.budget) / 1000} KWD`);
      } else {
        console.log(`❌ Ad budget is significantly different from purchased budget`);
        console.log(`This suggests a data entry or calculation error`);
      }
    }
    
    console.log('\n🔍 Budget issue analysis complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error analyzing ad budget issue:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeAdBudgetIssue();
}
