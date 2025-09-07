const { Ad, PurchasedPackage, AdvertiserPackage } = require('../src/models');

async function investigateAdsIssue() {
  console.log('🔍 INVESTIGATING ADS AVAILABILITY ISSUE\n');
  
  try {
    // Check all ads
    console.log('1️⃣ Checking All Ads...');
    const allAds = await Ad.findAll({
      include: [
        { model: PurchasedPackage, as: 'purchasedPackage' },
        { model: AdvertiserPackage, as: 'package' }
      ]
    });
    
    console.log(`Total ads in database: ${allAds.length}`);
    
    if (allAds.length === 0) {
      console.log('❌ No ads exist in database');
      return;
    }
    
    // Analyze each ad
    console.log('\n2️⃣ Analyzing Individual Ads...');
    for (const ad of allAds) {
      console.log(`\nAd: ${ad.title}`);
      console.log(`  - Status: ${ad.status}`);
      console.log(`  - Active: ${ad.is_active}`);
      console.log(`  - Verification: ${ad.verification_status}`);
      console.log(`  - Section: ${ad.section}`);
      console.log(`  - Purchased Package ID: ${ad.purchased_package_id}`);
      
      if (ad.purchasedPackage) {
        console.log(`  - Package Status: ${ad.purchasedPackage.status}`);
        console.log(`  - Remaining Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
        console.log(`  - Used Budget: ${ad.purchasedPackage.used_budget} KWD`);
        console.log(`  - Total Budget: ${ad.purchasedPackage.purchased_budget} KWD`);
      } else {
        console.log(`  ❌ No purchased package associated`);
      }
      
      if (ad.package) {
        console.log(`  - Package Type: ${ad.package.name}`);
        console.log(`  - Price per View: ${ad.package.price_per_view} KWD`);
      } else {
        console.log(`  ❌ No package type associated`);
      }
    }
    
    // Check why ads are not available
    console.log('\n3️⃣ Checking Availability Filters...');
    
    const activeAds = allAds.filter(ad => ad.status === 'active');
    console.log(`Active ads: ${activeAds.length}`);
    
    const verifiedAds = activeAds.filter(ad => ad.verification_status === 'approved');
    console.log(`Verified ads: ${verifiedAds.length}`);
    
    const adsWithPackages = verifiedAds.filter(ad => ad.purchased_package_id !== null);
    console.log(`Ads with packages: ${adsWithPackages.length}`);
    
    const adsWithBudget = adsWithPackages.filter(ad => 
      ad.purchasedPackage && 
      parseFloat(ad.purchasedPackage.remaining_budget) > 0
    );
    console.log(`Ads with remaining budget: ${adsWithBudget.length}`);
    
    if (adsWithBudget.length === 0) {
      console.log('\n❌ ISSUE IDENTIFIED: No ads have remaining budget');
      console.log('This means all purchased packages have been used up');
    }
    
  } catch (error) {
    console.error('❌ Error investigating ads issue:', error);
    throw error;
  }
}

if (require.main === module) {
  investigateAdsIssue().then(() => {
    console.log('\n🎯 Investigation completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Investigation failed:', error);
    process.exit(1);
  });
}

module.exports = { investigateAdsIssue };
