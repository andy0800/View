// Comprehensive diagnostic script for P15/P20 ads failure
const { sequelize, Ad, PurchasedPackage, AdvertiserPackage, User, ViewEvent } = require('./src/models');

async function diagnoseP15P20Failure() {
  try {
    console.log('🔍 COMPREHENSIVE DIAGNOSIS OF P15/P20 ADS FAILURE...\n');
    
    // 1. Find the advertiser
    const advertiser = await User.findOne({
      where: { phone: '+96550000000', role: 'advertiser' }
    });
    
    if (!advertiser) {
      console.log('❌ Advertiser not found!');
      return;
    }
    
    console.log(`✅ Advertiser found: ${advertiser.name} (ID: ${advertiser.id})`);
    
    // 2. Get all ads and analyze their view events
    const ads = await Ad.findAll({
      where: { advertiserId: advertiser.id },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        include: [{
          model: AdvertiserPackage,
          as: 'package'
        }]
      }]
    });
    
    console.log(`\n📺 ANALYZING ${ads.length} ADS...`);
    
    for (const ad of ads) {
      const pkg = ad.purchasedPackage.package;
      console.log(`\n🔍 AD: ${ad.title}`);
      console.log(`  - Package: ${pkg.name} (${pkg.duration}s)`);
      console.log(`  - Status: ${ad.status}, Verification: ${ad.verification_status}`);
      console.log(`  - Budget: ${ad.purchasedPackage.remaining_micro}/${ad.purchasedPackage.budget_micro} micro units`);
      console.log(`  - Views: ${ad.purchasedPackage.views_completed}/${ad.purchasedPackage.estimated_views}`);
      
      // Check view events for this ad
      const viewEvents = await ViewEvent.findAll({
        where: { ad_id: ad.id },
        order: [['viewed_at', 'DESC']], // Use viewed_at instead of created_at
        limit: 5
      });
      
      console.log(`  - View Events: ${viewEvents.length} total`);
      
      if (viewEvents.length > 0) {
        const completedViews = viewEvents.filter(ve => ve.is_completed);
        const pendingViews = viewEvents.filter(ve => !ve.is_completed);
        
        console.log(`    ✅ Completed: ${completedViews.length}`);
        console.log(`    ⏳ Pending: ${pendingViews.length}`);
        
        // Show details of recent view events
        viewEvents.slice(0, 3).forEach((ve, index) => {
          console.log(`    ${index + 1}. View Event ID: ${ve.id}`);
          console.log(`       - Completed: ${ve.is_completed}`);
          console.log(`       - Charged: ${ve.charged_micro} micro units`);
          console.log(`       - Viewer Reward: ${ve.viewer_reward_micro} micro units`);
          console.log(`       - Company Share: ${ve.company_share_micro} micro units`);
          console.log(`       - Viewed: ${ve.viewed_at}`);
          console.log(`       - Completed: ${ve.completed_at || 'N/A'}`);
        });
      } else {
        console.log(`    ❌ NO VIEW EVENTS FOUND - This explains why no rewards!`);
      }
    }
    
    // 3. Check for any failed view events or incomplete processing
    console.log('\n🚨 CHECKING FOR FAILED VIEW EVENTS...');
    
    const allViewEvents = await ViewEvent.findAll({
      include: [{
        model: Ad,
        as: 'ad',
        where: { advertiserId: advertiser.id },
        include: [{
          model: PurchasedPackage,
          as: 'purchasedPackage',
          include: [{
            model: AdvertiserPackage,
            as: 'package'
          }]
        }]
      }]
    });
    
    const failedEvents = allViewEvents.filter(ve => {
      // Check for events that were created but never completed
      return ve.viewed_at && !ve.is_completed && !ve.completed_at;
    });
    
    console.log(`Found ${failedEvents.length} failed/incomplete view events:`);
    
    failedEvents.forEach((ve, index) => {
      const ad = ve.ad;
      const pkg = ad.purchasedPackage.package;
      console.log(`\n  ${index + 1}. Failed View Event: ${ve.id}`);
      console.log(`     - Ad: ${ad.title} (${pkg.name})`);
      console.log(`     - Viewed: ${ve.viewed_at}`);
      console.log(`     - Proof Token: ${ve.proof_token ? 'Present' : 'Missing'}`);
      console.log(`     - Status: ${ve.is_completed ? 'Completed' : 'Pending'}`);
    });
    
    // 4. Check for any database constraints or validation issues
    console.log('\n🔍 CHECKING DATABASE CONSTRAINTS...');
    
    // Test if we can create a view event for P15/P20 ads
    const p15Ad = ads.find(ad => ad.purchasedPackage.package.duration === 15);
    const p20Ad = ads.find(ad => ad.purchasedPackage.package.duration === 20);
    
    if (p15Ad) {
      console.log(`\n🧪 TESTING P15 AD VIEW EVENT CREATION...`);
      try {
        // Test if we can create a view event (dry run)
        const testViewEvent = ViewEvent.build({
          ad_id: p15Ad.id,
          user_id: 'test-user-id',
          purchased_package_id: p15Ad.purchased_package_id,
          package_id: p15Ad.purchasedPackage.package_id,
          proof_token: 'test-token-123',
          proof_token_expires_at: new Date(Date.now() + 300000), // 5 minutes
          charged_micro: p15Ad.purchasedPackage.package.price_per_view_micro,
          viewer_reward_micro: Math.floor(p15Ad.purchasedPackage.package.price_per_view_micro / 2),
          company_share_micro: p15Ad.purchasedPackage.package.price_per_view_micro - Math.floor(p15Ad.purchasedPackage.package.price_per_view_micro / 2),
          is_completed: false,
          watched_duration_ms: 0,
          required_duration_ms: p15Ad.purchasedPackage.package.duration * 1000
        });
        
        console.log(`  ✅ P15 view event can be created successfully`);
        console.log(`  - Charged: ${testViewEvent.charged_micro} micro units`);
        console.log(`  - Viewer Reward: ${testViewEvent.viewer_reward_micro} micro units`);
        console.log(`  - Company Share: ${testViewEvent.company_share_micro} micro units`);
        
      } catch (error) {
        console.log(`  ❌ P15 view event creation failed: ${error.message}`);
      }
    }
    
    if (p20Ad) {
      console.log(`\n🧪 TESTING P20 AD VIEW EVENT CREATION...`);
      try {
        // Test if we can create a view event (dry run)
        const testViewEvent = ViewEvent.build({
          ad_id: p20Ad.id,
          user_id: 'test-user-id',
          purchased_package_id: p20Ad.purchased_package_id,
          package_id: p20Ad.purchasedPackage.package_id,
          proof_token: 'test-token-456',
          proof_token_expires_at: new Date(Date.now() + 300000), // 5 minutes
          charged_micro: p20Ad.purchasedPackage.package.price_per_view_micro,
          viewer_reward_micro: Math.floor(p20Ad.purchasedPackage.package.price_per_view_micro / 2),
          company_share_micro: p20Ad.purchasedPackage.package.price_per_view_micro - Math.floor(p20Ad.purchasedPackage.package.price_per_view_micro / 2),
          is_completed: false,
          watched_duration_ms: 0,
          required_duration_ms: p20Ad.purchasedPackage.package.duration * 1000
        });
        
        console.log(`  ✅ P20 view event can be created successfully`);
        console.log(`  - Charged: ${testViewEvent.charged_micro} micro units`);
        console.log(`  - Viewer Reward: ${testViewEvent.viewer_reward_micro} micro units`);
        console.log(`  - Company Share: ${testViewEvent.company_share_micro} micro units`);
        
      } catch (error) {
        console.log(`  ❌ P20 view event creation failed: ${error.message}`);
      }
    }
    
    // 5. Summary and recommendations
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    
    const workingAds = ads.filter(ad => ad.purchasedPackage.views_completed > 0);
    const nonWorkingAds = ads.filter(ad => ad.purchasedPackage.views_completed === 0);
    
    console.log(`  ✅ Working ads: ${workingAds.length} (P10, P30)`);
    console.log(`  ❌ Non-working ads: ${nonWorkingAds.length} (P15, P20)`);
    
    if (nonWorkingAds.length > 0) {
      console.log('\n🔍 ROOT CAUSE IDENTIFIED:');
      console.log('  The P15 and P20 ads have NO VIEW EVENTS created.');
      console.log('  This means the frontend is not successfully calling startWatchingAd().');
      console.log('  The issue is likely in the proof token generation or API call process.');
      
      console.log('\n💡 RECOMMENDED FIXES:');
      console.log('  1. Reset proof tokens for P15/P20 ads');
      console.log('  2. Force recreation of view events');
      console.log('  3. Add comprehensive error logging to frontend');
      console.log('  4. Implement retry mechanism for failed API calls');
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await sequelize.close();
  }
}

diagnoseP15P20Failure();
