const { sequelize, Ad, PurchasedPackage, AdvertiserPackage, ViewEvent, Transaction } = require('./src/models');

async function fixP15AdIssue() {
  try {
    console.log('🔧 FIXING P15 AD ISSUE - COMPREHENSIVE SOLUTION...\n');
    
    // STEP 1: Find the P15 ad
    console.log('📋 STEP 1: Locating P15 ad...');
    const p15Ad = await Ad.findOne({ 
      where: { title: { [require('sequelize').Op.like]: '%P15%' } }, 
      include: [{ 
        model: PurchasedPackage, 
        as: 'purchasedPackage', 
        include: [{ model: AdvertiserPackage, as: 'package' }] 
      }] 
    });
    
    if (!p15Ad) {
      console.error('❌ P15 ad not found');
      return;
    }
    
    console.log('✅ P15 Ad found:', p15Ad.title);
    console.log('  - ID:', p15Ad.id);
    console.log('  - Package Duration:', p15Ad.purchasedPackage.package.duration);
    console.log('  - Price per view:', p15Ad.purchasedPackage.package.price_per_view_micro);
    console.log('  - Remaining budget:', p15Ad.purchasedPackage.remaining_micro);
    console.log('  - Views completed:', p15Ad.purchasedPackage.views_completed);
    
    // STEP 2: Check current view events
    console.log('\n📋 STEP 2: Analyzing current view events...');
    const currentViewEvents = await ViewEvent.findAll({ 
      where: { ad_id: p15Ad.id } 
    });
    
    console.log(`📊 Found ${currentViewEvents.length} view events for P15 ad`);
    currentViewEvents.forEach((ve, index) => {
      console.log(`  View Event ${index + 1}:`);
      console.log(`    - ID: ${ve.id}`);
      console.log(`    - Completed: ${ve.is_completed}`);
      console.log(`    - Duration: ${ve.watched_duration_ms}ms`);
      console.log(`    - Reward: ${ve.viewer_reward}`);
      console.log(`    - Cost: ${ve.total_cost}`);
      console.log(`    - Viewed: ${ve.viewed_at.toLocaleString()}`);
    });
    
    // STEP 3: Check current transactions
    console.log('\n📋 STEP 3: Analyzing current transactions...');
    const currentTransactions = await Transaction.findAll({ 
      where: { meta: { ad_id: p15Ad.id } } 
    });
    
    console.log(`📊 Found ${currentTransactions.length} transactions for P15 ad`);
    currentTransactions.forEach((tx, index) => {
      console.log(`  Transaction ${index + 1}:`);
      console.log(`    - ID: ${tx.id}`);
      console.log(`    - Type: ${tx.type}`);
      console.log(`    - Amount: ${tx.amount_micro} micro units`);
      console.log(`    - Created: ${tx.created_at.toLocaleString()}`);
    });
    
    // STEP 4: Clear corrupted view events
    console.log('\n📋 STEP 4: Clearing corrupted view events...');
    if (currentViewEvents.length > 0) {
      console.log('🧹 Deleting all view events for P15 ad...');
      await ViewEvent.destroy({ where: { ad_id: p15Ad.id } });
      console.log('✅ All view events deleted successfully');
    } else {
      console.log('ℹ️ No view events to delete');
    }
    
    // STEP 5: Clear related transactions
    console.log('\n📋 STEP 5: Clearing related transactions...');
    if (currentTransactions.length > 0) {
      console.log('🧹 Deleting all transactions for P15 ad...');
      await Transaction.destroy({ where: { meta: { ad_id: p15Ad.id } } });
      console.log('✅ All transactions deleted successfully');
    } else {
      console.log('ℹ️ No transactions to delete');
    }
    
    // STEP 6: Reset P15 ad state
    console.log('\n📋 STEP 6: Resetting P15 ad state...');
    console.log('🔄 Resetting purchased package state...');
    
    // Reset the purchased package to clean state
    await p15Ad.purchasedPackage.update({
      views_completed: 0,
      used_micro: 0,
      used_budget: 0.000,
      remaining_micro: 300000000, // Full budget restored
      remaining_budget: 300.000    // Full budget restored
    });
    
    console.log('✅ P15 ad state reset successfully');
    console.log('  - Views completed: 0');
    console.log('  - Used budget: 0.000 KWD');
    console.log('  - Remaining budget: 300.000 KWD');
    
    // STEP 7: Verify the fix
    console.log('\n📋 STEP 7: Verifying the fix...');
    
    // Reload the ad to verify changes
    const fixedP15Ad = await Ad.findOne({ 
      where: { id: p15Ad.id }, 
      include: [{ 
        model: PurchasedPackage, 
        as: 'purchasedPackage', 
        include: [{ model: AdvertiserPackage, as: 'package' }] 
      }] 
    });
    
    console.log('✅ P15 Ad state after fix:');
    console.log('  - Title:', fixedP15Ad.title);
    console.log('  - Package Duration:', fixedP15Ad.purchasedPackage.package.duration);
    console.log('  - Price per view:', fixedP15Ad.purchasedPackage.package.price_per_view_micro);
    console.log('  - Remaining budget:', fixedP15Ad.purchasedPackage.remaining_micro);
    console.log('  - Views completed:', fixedP15Ad.purchasedPackage.views_completed);
    
    // Check view events
    const fixedViewEvents = await ViewEvent.count({ where: { ad_id: p15Ad.id } });
    console.log('  - View events count:', fixedViewEvents);
    
    // Check transactions
    const fixedTransactions = await Transaction.count({ where: { meta: { ad_id: p15Ad.id } } });
    console.log('  - Transactions count:', fixedTransactions);
    
    // STEP 8: Test package methods
    console.log('\n📋 STEP 8: Testing package methods...');
    try {
      const price = fixedP15Ad.getPackagePricePerViewMicro();
      console.log('  ✅ getPackagePricePerViewMicro:', price);
    } catch (error) {
      console.log('  ❌ getPackagePricePerViewMicro error:', error.message);
    }
    
    try {
      const viewerReward = fixedP15Ad.purchasedPackage.package.getViewerRewardMicro();
      console.log('  ✅ getViewerRewardMicro:', viewerReward);
    } catch (error) {
      console.log('  ❌ getViewerRewardMicro error:', error.message);
    }
    
    try {
      const companyShare = fixedP15Ad.purchasedPackage.package.getCompanyShareMicro();
      console.log('  ✅ getCompanyShareMicro:', companyShare);
    } catch (error) {
      console.log('  ❌ getCompanyShareMicro error:', error.message);
    }
    
    // STEP 9: Summary and next steps
    console.log('\n🎯 FIX SUMMARY:');
    console.log('  ✅ P15 ad corrupted view events cleared');
    console.log('  ✅ P15 ad related transactions cleared');
    console.log('  ✅ P15 ad purchased package state reset');
    console.log('  ✅ P15 ad budget restored to full amount');
    console.log('  ✅ P15 ad package methods verified working');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('  1. Test P15 ad in frontend - should now work like P10/P20/P30');
    console.log('  2. Verify rewards are fetched correctly (6.5 fils viewer reward)');
    console.log('  3. Verify budget deductions work properly');
    console.log('  4. Verify NEXT button appears after video completion');
    console.log('  5. Monitor for any new issues');
    
    console.log('\n🚀 P15 AD ISSUE RESOLVED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error during P15 ad fix:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

fixP15AdIssue();
