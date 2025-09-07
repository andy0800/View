// Script to analyze all purchased packages and their usage
const { Ad, AdvertiserPackage, PurchasedPackage, User, sequelize } = require('../src/models');

async function analyzePurchasedPackages() {
  try {
    console.log('🔍 ANALYZING PURCHASED PACKAGES');
    console.log('=' .repeat(60));
    
    // Get all purchased packages with their ads
    const purchasedPackages = await PurchasedPackage.findAll({
      include: [
        {
          model: Ad,
          as: 'ads',
          attributes: ['id', 'title', 'budget', 'status', 'verification_status']
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
      ]
    });
    
    console.log(`Found ${purchasedPackages.length} purchased packages`);
    
    for (const purchasedPackage of purchasedPackages) {
      console.log(`\n📦 Purchased Package ID: ${purchasedPackage.id}`);
      console.log(`Advertiser: ${purchasedPackage.advertiser.name} (${purchasedPackage.advertiser.phone})`);
      console.log(`Package: ${purchasedPackage.package.name} (${purchasedPackage.package.duration}s)`);
      console.log(`Price per View: ${purchasedPackage.package.price_per_view} fils`);
      console.log(`Purchased Budget: ${purchasedPackage.purchased_budget} KWD`);
      console.log(`Used Budget: ${purchasedPackage.used_budget} KWD`);
      console.log(`Remaining Budget: ${purchasedPackage.remaining_budget} KWD`);
      console.log(`Status: ${purchasedPackage.status}`);
      console.log(`Is Active: ${purchasedPackage.is_active}`);
      
      if (purchasedPackage.ads && purchasedPackage.ads.length > 0) {
        console.log(`\n  📺 Associated Ads (${purchasedPackage.ads.length}):`);
        let totalAdBudget = 0;
        for (const ad of purchasedPackage.ads) {
          const adBudget = parseFloat(ad.budget) || 0;
          totalAdBudget += adBudget;
          console.log(`    - Ad ${ad.id}: "${ad.title}"`);
          console.log(`      Budget: ${ad.budget} KWD`);
          console.log(`      Status: ${ad.status}`);
          console.log(`      Verification: ${ad.verification_status}`);
        }
        
        console.log(`\n  📊 Budget Analysis:`);
        console.log(`    Total Ad Budgets: ${totalAdBudget} KWD`);
        console.log(`    Purchased Budget: ${purchasedPackage.purchased_budget} KWD`);
        console.log(`    Budget Difference: ${purchasedPackage.purchased_budget - totalAdBudget} KWD`);
        
        if (Math.abs(totalAdBudget - purchasedPackage.purchased_budget) < 0.01) {
          console.log(`    ✅ Budget allocation is correct`);
        } else {
          console.log(`    ⚠️  Budget allocation mismatch detected`);
        }
        
        if (purchasedPackage.remaining_budget < 0.01) {
          console.log(`    📝 Package is fully used (no remaining budget)`);
        } else {
          console.log(`    💰 Package has ${purchasedPackage.remaining_budget} KWD remaining`);
          
          // Calculate how many more views are possible
          const pricePerViewKWD = parseFloat(purchasedPackage.package.price_per_view) / 1000;
          const maxViews = Math.floor(purchasedPackage.remaining_budget / pricePerViewKWD);
          console.log(`    🎯 Can support approximately ${maxViews} more views`);
        }
      } else {
        console.log(`  ⚠️  No ads associated with this package`);
      }
    }
    
    // Check for any active packages that could be used for testing
    const activePackages = purchasedPackages.filter(pp => 
      pp.is_active && pp.status === 'active' && pp.remaining_budget > 0.01
    );
    
    console.log(`\n🎯 ACTIVE PACKAGES FOR TESTING:`);
    if (activePackages.length > 0) {
      activePackages.forEach(pp => {
        console.log(`  ✅ ${pp.package.name} - ${pp.remaining_budget} KWD remaining`);
      });
    } else {
      console.log(`  ❌ No active packages with remaining budget found`);
      console.log(`  💡 Need to create new purchased packages or reset existing ones`);
    }
    
    console.log('\n🔍 Purchased packages analysis complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error analyzing purchased packages:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzePurchasedPackages();
}
