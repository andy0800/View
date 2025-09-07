// Script to check ads status in database
const { Ad, User, AdvertiserPackage, PurchasedPackage } = require('../src/models');

async function checkAdsStatus() {
  try {
    console.log('🔍 Checking ads status in database...\n');

    // Check all ads
    const allAds = await Ad.findAll({
      include: [
        { model: User, as: 'advertiser', attributes: ['id', 'name', 'company_name'] },
        { model: AdvertiserPackage, as: 'package', attributes: ['name', 'duration'] },
        { model: PurchasedPackage, as: 'purchasedPackage', attributes: ['id', 'remaining_budget', 'status'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`📊 Total ads found: ${allAds.length}\n`);

    if (allAds.length === 0) {
      console.log('❌ No ads found in database');
      return;
    }

    // Group ads by status
    const adsByStatus = {};
    const adsByVerification = {};

    allAds.forEach(ad => {
      // Group by status
      const status = ad.status || 'unknown';
      if (!adsByStatus[status]) adsByStatus[status] = [];
      adsByStatus[status].push(ad);

      // Group by verification status
      const verificationStatus = ad.verification_status || 'unknown';
      if (!adsByVerification[verificationStatus]) adsByVerification[verificationStatus] = [];
      adsByVerification[verificationStatus].push(ad);
    });

    console.log('📋 Ads by Status:');
    Object.keys(adsByStatus).forEach(status => {
      console.log(`  ${status}: ${adsByStatus[status].length} ads`);
      adsByStatus[status].forEach(ad => {
        console.log(`    - ID: ${ad.id}`);
        console.log(`      Title: ${ad.title}`);
        console.log(`      Section: ${ad.section}`);
        console.log(`      Media: ${ad.mediaUrl}`);
        console.log(`      Advertiser: ${ad.advertiser?.name || 'Unknown'}`);
        console.log(`      Package: ${ad.package?.name || 'Unknown'}`);
        console.log(`      Purchased Package: ${ad.purchasedPackage ? `ID: ${ad.purchasedPackage.id}, Budget: ${ad.purchasedPackage.remaining_budget} KWD, Status: ${ad.purchasedPackage.status}` : 'None'}`);
        console.log('');
      });
    });

    console.log('📋 Ads by Verification Status:');
    Object.keys(adsByVerification).forEach(verificationStatus => {
      console.log(`  ${verificationStatus}: ${adsByVerification[verificationStatus].length} ads`);
    });

    // Check for ads that should be visible to viewers
    const visibleAds = allAds.filter(ad => 
      ad.status === 'active' && 
      ad.is_active === true && 
      ad.verification_status === 'approved' &&
      ad.purchasedPackage &&
      ad.purchasedPackage.remaining_budget > 0
    );

    console.log(`\n👁️ Ads visible to viewers: ${visibleAds.length}`);
    visibleAds.forEach(ad => {
      console.log(`  - ${ad.title} (${ad.section}) - Budget: ${ad.purchasedPackage.remaining_budget} KWD`);
    });

    // Check for ads that are approved but not active
    const approvedButNotActive = allAds.filter(ad => 
      ad.verification_status === 'approved' && 
      (ad.status !== 'active' || ad.is_active !== true)
    );

    if (approvedButNotActive.length > 0) {
      console.log(`\n⚠️ Ads approved but not active: ${approvedButNotActive.length}`);
      approvedButNotActive.forEach(ad => {
        console.log(`  - ${ad.title}: status=${ad.status}, is_active=${ad.is_active}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking ads status:', error);
  } finally {
    process.exit(0);
  }
}

checkAdsStatus();
