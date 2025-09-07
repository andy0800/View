// Check current budget status across the system
const { PurchasedPackage, Ad, AdvertiserPackage } = require('../src/models');

async function checkBudgetStatus() {
  try {
    console.log('🔍 CHECKING BUDGET STATUS ACROSS SYSTEM\n');

    // Check purchased packages
    const packages = await PurchasedPackage.findAll({
      include: [
        {
          model: AdvertiserPackage,
          as: 'package'
        }
      ]
    });

    console.log('📦 PURCHASED PACKAGES:');
    packages.forEach(p => {
      console.log(`ID: ${p.id}, Advertiser: ${p.advertiser_id}, Budget: ${p.purchased_budget} KWD, Remaining: ${p.remaining_budget} KWD, Used: ${p.used_budget} KWD, Status: ${p.status}`);
    });

    // Check ads
    const ads = await Ad.findAll({
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage'
        },
        {
          model: AdvertiserPackage,
          as: 'package'
        }
      ]
    });

    console.log('\n🎬 ADS:');
    ads.forEach(a => {
      console.log(`ID: ${a.id}, Title: ${a.title}, Status: ${a.status}, Verification: ${a.verification_status}, Budget: ${a.budget} KWD, Remaining: ${a.remaining_budget} KWD, Package ID: ${a.purchased_package_id}`);
      
      if (a.purchasedPackage) {
        console.log(`  ➤ Purchased Package Remaining: ${a.purchasedPackage.remaining_budget} KWD`);
      }
      
      if (a.package) {
        console.log(`  ➤ Price per view: ${a.package.price_per_view} KWD`);
      }
    });

    console.log('\n🔍 ISSUES IDENTIFIED:');
    
    // Check for ads with 0 remaining budget
    const zerobudgetAds = ads.filter(a => a.remaining_budget <= 0);
    if (zerobudgetAds.length > 0) {
      console.log(`❌ ${zerobudgetAds.length} ads have 0 remaining budget`);
    }

    // Check for purchased packages with 0 remaining budget
    const zeroBudgetPackages = packages.filter(p => p.remaining_budget <= 0);
    if (zeroBudgetPackages.length > 0) {
      console.log(`❌ ${zeroBudgetPackages.length} purchased packages have 0 remaining budget`);
    }

    // Check for mismatched budgets
    const mismatchedAds = ads.filter(a => {
      if (!a.purchasedPackage) return false;
      return a.purchasedPackage.remaining_budget <= 0 && a.remaining_budget > 0;
    });
    
    if (mismatchedAds.length > 0) {
      console.log(`❌ ${mismatchedAds.length} ads have budget mismatches with their purchased packages`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking budget status:', error);
    process.exit(1);
  }
}

checkBudgetStatus();
