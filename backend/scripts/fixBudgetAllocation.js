// Fix budget allocation - reset purchased packages to have proper remaining budget
const { PurchasedPackage, Ad, Wallet, Transaction, sequelize } = require('../src/models');

async function fixBudgetAllocation() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 FIXING BUDGET ALLOCATION SYSTEM\n');

    // Get all purchased packages with their ads
    const purchasedPackages = await PurchasedPackage.findAll({
      include: [
        {
          model: Ad,
          as: 'ads'
        }
      ]
    });

    console.log(`📦 Found ${purchasedPackages.length} purchased packages to fix\n`);

    for (const pkg of purchasedPackages) {
      console.log(`\n🔧 Fixing Package ID: ${pkg.id}`);
      console.log(`   Advertiser: ${pkg.advertiser_id}`);
      console.log(`   Purchased Budget: ${pkg.purchased_budget} KWD`);
      console.log(`   Current Remaining: ${pkg.remaining_budget} KWD`);
      console.log(`   Current Used: ${pkg.used_budget} KWD`);
      console.log(`   Associated Ads: ${pkg.ads?.length || 0}`);

      // Calculate total ad budgets allocated to this package
      const totalAdBudgets = pkg.ads?.reduce((sum, ad) => sum + parseFloat(ad.budget || 0), 0) || 0;
      console.log(`   Total Ad Budgets: ${totalAdBudgets} KWD`);

      // STRATEGY: Reset purchased package budget allocation
      // Keep ads with their budgets as "reserved" amounts, but don't deduct from package immediately
      // Package should have budget available for actual video views
      
      const newRemainingBudget = Math.max(0, pkg.purchased_budget - (pkg.used_budget || 0));
      
      // If the package was marked as fully used but has no actual view spending, reset it
      if (pkg.status === 'used' && (pkg.used_budget || 0) === 0) {
        console.log(`   🔄 Package marked as 'used' but no actual spending detected - resetting`);
        
        await pkg.update({
          remaining_budget: pkg.purchased_budget, // Reset to full budget
          used_budget: 0, // Reset used budget
          status: 'active' // Make it active again
        }, { transaction });

        console.log(`   ✅ Package reset: ${pkg.purchased_budget} KWD remaining, 0 KWD used, status: active`);
      } else {
        // Just update the remaining budget calculation
        await pkg.update({
          remaining_budget: newRemainingBudget,
          status: newRemainingBudget > 0 ? 'active' : 'used'
        }, { transaction });

        console.log(`   ✅ Package updated: ${newRemainingBudget} KWD remaining, status: ${newRemainingBudget > 0 ? 'active' : 'used'}`);
      }
    }

    await transaction.commit();
    console.log('\n🎉 Budget allocation fix completed successfully!');

    // Verify the fixes
    console.log('\n🔍 VERIFICATION:');
    const updatedPackages = await PurchasedPackage.findAll();
    updatedPackages.forEach(p => {
      const budgetStatus = p.remaining_budget > 0 ? '✅ HAS BUDGET' : '❌ NO BUDGET';
      console.log(`Package ${p.id}: ${p.remaining_budget} KWD remaining, status: ${p.status} ${budgetStatus}`);
    });

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error fixing budget allocation:', error);
    process.exit(1);
  }
}

fixBudgetAllocation();
