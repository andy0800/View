// Comprehensive analysis of ad insights data
const { 
  Ad, 
  AdvertiserPackage, 
  PurchasedPackage, 
  User, 
  ViewEvent, 
  Transaction,
  sequelize 
} = require('../src/models');
const { Op } = require('sequelize');

async function analyzeAdInsightsData() {
  try {
    console.log('🔍 COMPREHENSIVE AD INSIGHTS DATA ANALYSIS');
    console.log('=' .repeat(80));
    
    // Test 1: Database Overview
    console.log('\n📊 Test 1: Database Overview');
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
    
    // Test 2: Advertiser Packages Analysis
    console.log('\n📊 Test 2: Advertiser Packages Analysis');
    const packages = await AdvertiserPackage.findAll({
      order: [['duration', 'ASC']],
      attributes: ['id', 'name', 'duration', 'price_per_view', 'viewer_reward', 'company_fee', 'min_budget', 'budget_increment']
    });
    
    console.log('📋 Available Packages:');
    packages.forEach(pkg => {
      console.log(`  ${pkg.id}. ${pkg.name}`);
      console.log(`     Duration: ${pkg.duration}s`);
      console.log(`     Price per view: ${pkg.price_per_view} fils`);
      console.log(`     Viewer reward: ${pkg.viewer_reward} fils`);
      console.log(`     Company fee: ${pkg.company_fee} fils`);
      console.log(`     Min budget: ${pkg.min_budget} KWD`);
      console.log(`     Budget increment: ${pkg.budget_increment} KWD`);
      console.log('');
    });
    
    // Test 3: Purchased Packages Analysis
    console.log('\n📊 Test 3: Purchased Packages Analysis');
    const purchasedPackages = await PurchasedPackage.findAll({
      include: [
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'phone', 'role']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view', 'viewer_reward', 'company_fee']
        }
      ]
    });
    
    console.log('🛒 Purchased Packages:');
    purchasedPackages.forEach(pp => {
      console.log(`  ID: ${pp.id}`);
      console.log(`  Advertiser: ${pp.advertiser.name} (${pp.advertiser.phone})`);
      console.log(`  Package: ${pp.package.name} (${pp.package.duration}s)`);
      console.log(`  Package Price per view: ${pp.package.price_per_view} fils`);
      console.log(`  Purchased Budget: ${pp.purchased_budget} KWD`);
      console.log(`  Remaining Budget: ${pp.remaining_budget} KWD`);
      console.log(`  Used Budget: ${pp.used_budget} KWD`);
      console.log(`  Estimated Views: ${pp.estimated_views}`);
      console.log(`  Status: ${pp.status}`);
      console.log(`  Created: ${pp.created_at}`);
      console.log('');
    });
    
    // Test 4: Ads Analysis
    console.log('\n📊 Test 4: Ads Analysis');
    const ads = await Ad.findAll({
      include: [
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'phone', 'role']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view', 'viewer_reward', 'company_fee']
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'purchased_budget', 'remaining_budget', 'used_budget']
        }
      ]
    });
    
    console.log('📺 Ads Details:');
    ads.forEach(ad => {
      console.log(`  Ad ID: ${ad.id}`);
      console.log(`  Title: ${ad.title}`);
      console.log(`  Advertiser: ${ad.advertiser.name} (${ad.advertiser.phone})`);
      console.log(`  Section: ${ad.section}`);
      console.log(`  Package: ${ad.package.name} (${ad.package.duration}s)`);
      console.log(`  Package Price per view: ${ad.package.price_per_view} fils`);
      console.log(`  Ad Budget: ${ad.budget} KWD`);
      console.log(`  Remaining Budget: ${ad.remaining_budget} KWD`);
      console.log(`  Spent: ${ad.spent} KWD`);
      console.log(`  Views: ${ad.views}`);
      console.log(`  Status: ${ad.status}`);
      console.log(`  Verification: ${ad.verification_status}`);
      console.log(`  Purchased Package Budget: ${ad.purchasedPackage.purchased_budget} KWD`);
      console.log(`  Purchased Package Remaining: ${ad.purchasedPackage.remaining_budget} KWD`);
      console.log(`  Purchased Package Used: ${ad.purchasedPackage.used_budget} KWD`);
      console.log('');
    });
    
    // Test 5: View Events Analysis
    console.log('\n📊 Test 5: View Events Analysis');
    const viewEvents = await ViewEvent.findAll({
      include: [
        {
          model: Ad,
          as: 'ad',
          attributes: ['id', 'title', 'section'],
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
          attributes: ['id', 'name', 'phone', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('👀 View Events:');
    viewEvents.forEach(event => {
      console.log(`  Event ID: ${event.id}`);
      console.log(`  Ad: ${event.ad.title} (${event.ad.section})`);
      console.log(`  Viewer: ${event.viewer.name} (${event.viewer.phone})`);
      console.log(`  Required Duration: ${event.ad.package.duration}s`);
      console.log(`  Watched Duration: ${event.watched_duration}s`);
      console.log(`  Is Completed: ${event.is_completed}`);
      console.log(`  Reward Amount: ${event.reward_amount} fils`);
      console.log(`  Created: ${event.created_at}`);
      console.log('');
    });
    
    // Test 6: Transactions Analysis
    console.log('\n📊 Test 6: Transactions Analysis');
    const transactions = await Transaction.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('💰 Transactions:');
    transactions.forEach(tx => {
      console.log(`  Transaction ID: ${tx.id}`);
      console.log(`  User: ${tx.user.name} (${tx.user.phone}) - ${tx.user.role}`);
      console.log(`  Amount: ${tx.amount} fils`);
      console.log(`  Category: ${tx.transaction_category}`);
      console.log(`  Description: ${tx.description}`);
      console.log(`  Created: ${tx.created_at}`);
      console.log('');
    });
    
    // Test 7: Data Consistency Check
    console.log('\n📊 Test 7: Data Consistency Check');
    
    // Check if ad views match view events
    for (const ad of ads) {
      const adViewEvents = await ViewEvent.count({
        where: { 
          ad_id: ad.id,
          is_completed: true
        }
      });
      
      console.log(`  Ad "${ad.title}" (ID: ${ad.id}):`);
      console.log(`    Ad.views field: ${ad.views}`);
      console.log(`    Actual completed view events: ${adViewEvents}`);
      console.log(`    Match: ${ad.views === adViewEvents ? '✅' : '❌'}`);
      
      if (ad.views !== adViewEvents) {
        console.log(`    ⚠️  MISMATCH DETECTED!`);
      }
      console.log('');
    }
    
    // Check if purchased package budgets are consistent
    for (const pp of purchasedPackages) {
      const adsUsingPackage = await Ad.count({
        where: { purchased_package_id: pp.id }
      });
      
      const totalAdBudget = await Ad.sum('budget', {
        where: { purchased_package_id: pp.id }
      });
      
      console.log(`  Purchased Package ${pp.id}:`);
      console.log(`    Purchased Budget: ${pp.purchased_budget} KWD`);
      console.log(`    Used Budget: ${pp.used_budget} KWD`);
      console.log(`    Remaining Budget: ${pp.remaining_budget} KWD`);
      console.log(`    Ads using this package: ${adsUsingPackage}`);
      console.log(`    Total ad budgets: ${totalAdBudget || 0} KWD`);
      console.log(`    Budget consistency: ${Math.abs(pp.used_budget - (totalAdBudget || 0)) < 0.01 ? '✅' : '❌'}`);
      console.log('');
    }
    
    // Test 8: Price Calculations Check
    console.log('\n📊 Test 8: Price Calculations Check');
    
    for (const ad of ads) {
      if (ad.views > 0 && ad.spent > 0) {
        const actualCostPerView = ad.spent / ad.views;
        const expectedCostPerView = ad.package.price_per_view / 1000; // Convert fils to KWD
        
        console.log(`  Ad "${ad.title}":`);
        console.log(`    Views: ${ad.views}`);
        console.log(`    Spent: ${ad.spent} KWD`);
        console.log(`    Actual Cost per View: ${actualCostPerView.toFixed(6)} KWD`);
        console.log(`    Expected Cost per View: ${expectedCostPerView.toFixed(6)} KWD`);
        console.log(`    Price Match: ${Math.abs(actualCostPerView - expectedCostPerView) < 0.001 ? '✅' : '❌'}`);
        console.log('');
      }
    }
    
    // Final Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📋 AD INSIGHTS DATA ANALYSIS SUMMARY');
    console.log('=' .repeat(80));
    
    const issues = [];
    
    // Check for common issues
    if (totalAds === 0) issues.push('No ads found in database');
    if (totalPackages === 0) issues.push('No advertiser packages found');
    if (totalPurchasedPackages === 0) issues.push('No purchased packages found');
    
    // Check for data inconsistencies
    const viewMismatches = ads.filter(ad => {
      return ViewEvent.count({ where: { ad_id: ad.id, is_completed: true } }) !== ad.views;
    }).length;
    
    if (viewMismatches > 0) {
      issues.push(`${viewMismatches} ads have view count mismatches`);
    }
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected in ad insights data');
    } else {
      console.log('⚠️  Issues detected:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    console.log('\n🚀 Analysis complete! Check the details above for specific issues.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error analyzing ad insights data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeAdInsightsData();
}

module.exports = { analyzeAdInsightsData };
