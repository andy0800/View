// Script to fix budget inconsistencies in the database
const { 
  Ad, 
  AdvertiserPackage, 
  PurchasedPackage, 
  User, 
  sequelize 
} = require('../src/models');

async function fixBudgetInconsistencies() {
  try {
    console.log('🔧 FIXING BUDGET INCONSISTENCIES');
    console.log('=' .repeat(60));
    
    // Get all ads with their purchased packages
    const ads = await Ad.findAll({
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'purchased_budget', 'remaining_budget', 'used_budget', 'status']
        }
      ]
    });
    
    console.log(`📊 Found ${ads.length} ads to check`);
    
    let fixedCount = 0;
    let issuesFound = 0;
    
    for (const ad of ads) {
      if (!ad.purchasedPackage) {
        console.log(`⚠️  Ad ${ad.id} has no purchased package - skipping`);
        continue;
      }
      
      const adBudget = parseFloat(ad.budget) || 0;
      const purchasedPackageBudget = parseFloat(ad.purchasedPackage.purchased_budget) || 0;
      const usedBudget = parseFloat(ad.purchasedPackage.used_budget) || 0;
      const remainingBudget = parseFloat(ad.purchasedPackage.remaining_budget) || 0;
      
      // Check for inconsistencies
      const expectedUsedBudget = adBudget;
      const expectedRemainingBudget = purchasedPackageBudget - adBudget;
      
      const usedBudgetMismatch = Math.abs(usedBudget - expectedUsedBudget) > 0.01;
      const remainingBudgetMismatch = Math.abs(remainingBudget - expectedRemainingBudget) > 0.01;
      
      if (usedBudgetMismatch || remainingBudgetMismatch) {
        issuesFound++;
        console.log(`\n🔍 Ad ${ad.id} (${ad.title}):`);
        console.log(`  Current used_budget: ${usedBudget} KWD`);
        console.log(`  Expected used_budget: ${expectedUsedBudget} KWD`);
        console.log(`  Current remaining_budget: ${remainingBudget} KWD`);
        console.log(`  Expected remaining_budget: ${expectedRemainingBudget} KWD`);
        
        // Fix the inconsistency
        try {
          await ad.purchasedPackage.update({
            used_budget: expectedUsedBudget,
            remaining_budget: expectedRemainingBudget,
            status: expectedRemainingBudget <= 0 ? 'used' : 'active'
          });
          
          console.log(`  ✅ Fixed! Updated to:`);
          console.log(`    used_budget: ${expectedUsedBudget} KWD`);
          console.log(`    remaining_budget: ${expectedRemainingBudget} KWD`);
          console.log(`    status: ${expectedRemainingBudget <= 0 ? 'used' : 'active'}`);
          
          fixedCount++;
        } catch (updateError) {
          console.error(`  ❌ Failed to update:`, updateError.message);
        }
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total ads checked: ${ads.length}`);
    console.log(`Issues found: ${issuesFound}`);
    console.log(`Issues fixed: ${fixedCount}`);
    
    if (issuesFound === 0) {
      console.log('✅ No budget inconsistencies found!');
    } else if (fixedCount === issuesFound) {
      console.log('✅ All budget inconsistencies have been fixed!');
    } else {
      console.log(`⚠️  ${issuesFound - fixedCount} issues could not be fixed`);
    }
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const verificationAds = await Ad.findAll({
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'purchased_budget', 'remaining_budget', 'used_budget', 'status']
        }
      ]
    });
    
    let remainingIssues = 0;
    for (const ad of verificationAds) {
      if (!ad.purchasedPackage) continue;
      
      const adBudget = parseFloat(ad.budget) || 0;
      const purchasedPackageBudget = parseFloat(ad.purchasedPackage.purchased_budget) || 0;
      const usedBudget = parseFloat(ad.purchasedPackage.used_budget) || 0;
      const remainingBudget = parseFloat(ad.purchasedPackage.remaining_budget) || 0;
      
      const expectedUsedBudget = adBudget;
      const expectedRemainingBudget = purchasedPackageBudget - adBudget;
      
      const usedBudgetMismatch = Math.abs(usedBudget - expectedUsedBudget) > 0.01;
      const remainingBudgetMismatch = Math.abs(remainingBudget - expectedRemainingBudget) > 0.01;
      
      if (usedBudgetMismatch || remainingBudgetMismatch) {
        remainingIssues++;
      }
    }
    
    if (remainingIssues === 0) {
      console.log('✅ Verification complete: All budget inconsistencies have been resolved!');
    } else {
      console.log(`⚠️  Verification found ${remainingIssues} remaining inconsistencies`);
    }
    
    console.log('\n🚀 Budget consistency fix complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing budget inconsistencies:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixBudgetInconsistencies();
}

module.exports = { fixBudgetInconsistencies };
