// Script to fix ad budget values that are incorrectly stored in fils instead of KWD
const { Ad, sequelize } = require('../src/models');

async function fixAdBudgetValues() {
  try {
    console.log('🔧 FIXING AD BUDGET VALUES');
    console.log('=' .repeat(60));
    
    // Check current ad budget values
    const ads = await Ad.findAll({
      attributes: ['id', 'title', 'budget', 'remaining_budget', 'spent']
    });
    
    console.log(`Found ${ads.length} ads to check`);
    
    let fixedCount = 0;
    let issuesFound = 0;
    
    for (const ad of ads) {
      const currentBudget = parseFloat(ad.budget) || 0;
      const currentRemainingBudget = parseFloat(ad.remaining_budget) || 0;
      const currentSpent = parseFloat(ad.spent) || 0;
      
      // Check if budget is suspiciously large (likely in fils)
      // Normal KWD budgets should be reasonable (e.g., 300, 500, 1000)
      // If it's 300000, that's likely 300 KWD stored as fils
      if (currentBudget > 10000) { // Suspiciously large for KWD
        issuesFound++;
        console.log(`\n🔍 Ad ${ad.id} (${ad.title}):`);
        console.log(`  Current Budget: ${currentBudget} (suspiciously large)`);
        console.log(`  Current Remaining: ${currentRemainingBudget}`);
        console.log(`  Current Spent: ${currentSpent}`);
        
        // Convert from fils to KWD (divide by 1000)
        const correctedBudget = currentBudget / 1000;
        const correctedRemainingBudget = currentRemainingBudget / 1000;
        const correctedSpent = currentSpent / 1000;
        
        console.log(`  Corrected Budget: ${correctedBudget} KWD`);
        console.log(`  Corrected Remaining: ${correctedRemainingBudget} KWD`);
        console.log(`  Corrected Spent: ${correctedSpent} KWD`);
        
        try {
          await ad.update({
            budget: correctedBudget,
            remaining_budget: correctedRemainingBudget,
            spent: correctedSpent
          });
          
          console.log(`  ✅ Fixed! Updated to KWD values`);
          fixedCount++;
        } catch (updateError) {
          console.error(`  ❌ Failed to update:`, updateError.message);
        }
      } else {
        console.log(`✅ Ad ${ad.id}: Budget ${currentBudget} KWD (looks correct)`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total ads checked: ${ads.length}`);
    console.log(`Issues found: ${issuesFound}`);
    console.log(`Issues fixed: ${fixedCount}`);
    
    if (issuesFound === 0) {
      console.log('✅ No budget value issues found!');
    } else if (fixedCount === issuesFound) {
      console.log('✅ All budget value issues have been fixed!');
    } else {
      console.log(`⚠️  ${issuesFound - fixedCount} issues could not be fixed`);
    }
    
    // Verify fixes
    if (fixedCount > 0) {
      console.log('\n🔍 Verifying fixes...');
      const verificationAds = await Ad.findAll({
        attributes: ['id', 'title', 'budget', 'remaining_budget', 'spent']
      });
      
      let remainingIssues = 0;
      for (const ad of verificationAds) {
        const budget = parseFloat(ad.budget) || 0;
        if (budget > 10000) {
          remainingIssues++;
        }
      }
      
      if (remainingIssues === 0) {
        console.log('✅ Verification complete: All budget values are now in KWD!');
      } else {
        console.log(`⚠️  Verification found ${remainingIssues} remaining issues`);
      }
    }
    
    console.log('\n🚀 Ad budget value fix complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing ad budget values:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixAdBudgetValues();
}
