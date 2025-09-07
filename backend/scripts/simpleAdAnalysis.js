// Simple ad analysis script
const { 
  Ad, 
  AdvertiserPackage, 
  PurchasedPackage, 
  User, 
  ViewEvent, 
  Transaction,
  sequelize 
} = require('../src/models');

async function simpleAdAnalysis() {
  try {
    console.log('🔍 SIMPLE AD ANALYSIS');
    console.log('=' .repeat(50));
    
    // Test 1: Basic counts
    console.log('\n📊 Basic Counts:');
    const totalAds = await Ad.count();
    const totalPackages = await AdvertiserPackage.count();
    const totalPurchasedPackages = await PurchasedPackage.count();
    const totalViewEvents = await ViewEvent.count();
    const totalTransactions = await Transaction.count();
    
    console.log(`📈 Total Ads: ${totalAds}`);
    console.log(`📦 Total Packages: ${totalPackages}`);
    console.log(`🛒 Total Purchased Packages: ${totalPurchasedPackages}`);
    console.log(`👀 Total View Events: ${totalViewEvents}`);
    console.log(`💰 Total Transactions: ${totalTransactions}`);
    
    // Test 2: Advertiser Packages
    console.log('\n📊 Advertiser Packages:');
    const packages = await AdvertiserPackage.findAll({
      order: [['duration', 'ASC']]
    });
    
    packages.forEach(pkg => {
      console.log(`  ${pkg.id}. ${pkg.name} - ${pkg.duration}s - ${pkg.price_per_view} fils/view`);
    });
    
    // Test 3: Purchased Packages
    console.log('\n📊 Purchased Packages:');
    const purchasedPackages = await PurchasedPackage.findAll({
      include: [
        {
          model: User,
          as: 'advertiser',
          attributes: ['name', 'phone']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view']
        }
      ]
    });
    
    purchasedPackages.forEach(pp => {
      console.log(`  ID: ${pp.id}`);
      console.log(`    Advertiser: ${pp.advertiser.name} (${pp.advertiser.phone})`);
      console.log(`    Package: ${pp.package.name} (${pp.package.duration}s)`);
      console.log(`    Price per view: ${pp.package.price_per_view} fils`);
      console.log(`    Purchased Budget: ${pp.purchased_budget} KWD`);
      console.log(`    Remaining Budget: ${pp.remaining_budget} KWD`);
      console.log(`    Used Budget: ${pp.used_budget} KWD`);
      console.log(`    Estimated Views: ${pp.estimated_views}`);
      console.log(`    Status: ${pp.status}`);
      console.log('');
    });
    
    // Test 4: Ads
    console.log('\n📊 Ads:');
    const ads = await Ad.findAll({
      include: [
        {
          model: User,
          as: 'advertiser',
          attributes: ['name', 'phone']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view']
        }
      ]
    });
    
    ads.forEach(ad => {
      console.log(`  Ad ID: ${ad.id}`);
      console.log(`    Title: ${ad.title}`);
      console.log(`    Advertiser: ${ad.advertiser.name} (${ad.advertiser.phone})`);
      console.log(`    Section: ${ad.section}`);
      console.log(`    Package: ${ad.package.name} (${ad.package.duration}s)`);
      console.log(`    Package Price per view: ${ad.package.price_per_view} fils`);
      console.log(`    Ad Budget: ${ad.budget} KWD`);
      console.log(`    Remaining Budget: ${ad.remaining_budget} KWD`);
      console.log(`    Spent: ${ad.spent} KWD`);
      console.log(`    Views: ${ad.views}`);
      console.log(`    Status: ${ad.status}`);
      console.log(`    Verification: ${ad.verification_status}`);
      console.log(`    Purchased Package ID: ${ad.purchased_package_id}`);
      console.log('');
    });
    
    // Test 5: View Events
    console.log('\n📊 View Events:');
    const viewEvents = await ViewEvent.findAll({
      include: [
        {
          model: Ad,
          as: 'ad',
          attributes: ['title', 'section'],
          include: [
            {
              model: AdvertiserPackage,
              as: 'package',
              attributes: ['duration', 'price_per_view']
            }
          ]
        },
        {
          model: User,
          as: 'viewer',
          attributes: ['name', 'phone']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    viewEvents.forEach(event => {
      console.log(`  Event ID: ${event.id}`);
      console.log(`    Ad: ${event.ad.title} (${event.ad.section})`);
      console.log(`    Viewer: ${event.viewer.name} (${event.viewer.phone})`);
      console.log(`    Required Duration: ${event.ad.package.duration}s`);
      console.log(`    Watched Duration: ${event.watched_duration}s`);
      console.log(`    Is Completed: ${event.is_completed}`);
      console.log(`    Reward Amount: ${event.reward_amount} fils`);
      console.log(`    Created: ${event.created_at}`);
      console.log('');
    });
    
    // Test 6: Data Consistency Issues
    console.log('\n📊 Data Consistency Issues:');
    
    // Check ad views vs view events
    for (const ad of ads) {
      const completedViews = await ViewEvent.count({
        where: { 
          ad_id: ad.id,
          is_completed: true
        }
      });
      
      if (ad.views !== completedViews) {
        console.log(`  ⚠️  Ad "${ad.title}":`);
        console.log(`    Ad.views field: ${ad.views}`);
        console.log(`    Actual completed views: ${completedViews}`);
        console.log(`    MISMATCH: ${Math.abs(ad.views - completedViews)}`);
        console.log('');
      }
    }
    
    // Check purchased package budget consistency
    for (const pp of purchasedPackages) {
      const adsUsingPackage = await Ad.count({
        where: { purchased_package_id: pp.id }
      });
      
      const totalAdBudget = await Ad.sum('budget', {
        where: { purchased_package_id: pp.id }
      });
      
      if (Math.abs(pp.used_budget - (totalAdBudget || 0)) > 0.01) {
        console.log(`  ⚠️  Purchased Package ${pp.id}:`);
        console.log(`    Purchased Budget: ${pp.purchased_budget} KWD`);
        console.log(`    Used Budget: ${pp.used_budget} KWD`);
        console.log(`    Total ad budgets: ${totalAdBudget || 0} KWD`);
        console.log(`    Budget inconsistency: ${Math.abs(pp.used_budget - (totalAdBudget || 0))} KWD`);
        console.log('');
      }
    }
    
    console.log('\n✅ Analysis complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  simpleAdAnalysis();
}
