#!/usr/bin/env node
// Fix corrupted budget values in purchased_packages table
// This script resets impossible budget values that are causing numeric overflow errors

const { sequelize } = require('../models');

async function fixCorruptedBudgets() {
  console.log('🔧 Starting corrupted budget cleanup...\n');
  
  try {
    // Check current corrupted data
    console.log('📊 Checking for corrupted budget values...');
    
    const [corruptedPackages] = await sequelize.query(`
      SELECT 
        id,
        advertiser_id,
        package_id,
        purchased_budget,
        remaining_budget,
        used_budget,
        budget_micro,
        remaining_micro,
        used_micro,
        views_completed,
        status
      FROM purchased_packages 
      WHERE used_micro > 1000000000 
         OR used_budget > 1000000 
         OR remaining_micro > 1000000000
         OR remaining_budget > 1000000
      ORDER BY used_micro DESC;
    `);
    
    if (corruptedPackages.length === 0) {
      console.log('✅ No corrupted budget values found!');
      return;
    }
    
    console.log(`❌ Found ${corruptedPackages.length} corrupted packages:`);
    corruptedPackages.forEach(pkg => {
      console.log(`   Package ID: ${pkg.id}`);
      console.log(`   Used Micro: ${pkg.used_micro} (should be < 1B)`);
      console.log(`   Used Budget: ${pkg.used_budget} KWD (should be < 1M)`);
      console.log(`   Remaining Micro: ${pkg.remaining_micro} (should be < 1B)`);
      console.log(`   Remaining Budget: ${pkg.remaining_budget} KWD (should be < 1M)`);
      console.log(`   Views Completed: ${pkg.views_completed}`);
      console.log('   ---');
    });
    
    console.log('\n🔧 Starting budget value correction...');
    
    // Start transaction for safe updates
    const transaction = await sequelize.transaction();
    
    try {
      let correctedCount = 0;
      
      for (const pkg of corruptedPackages) {
        console.log(`\n🔄 Fixing package ${pkg.id}...`);
        
        // Calculate correct values based on views completed
        const viewsCompleted = pkg.views_completed || 0;
        
        // Get package price per view (default to 10,000 micro units = 0.01 KWD)
        const [packageInfo] = await sequelize.query(`
          SELECT price_per_view_micro FROM advertiser_packages WHERE id = ?
        `, {
          replacements: [pkg.package_id],
          transaction
        });
        
        const pricePerViewMicro = packageInfo[0]?.price_per_view_micro || 10000;
        
        // Calculate correct used values
        const correctUsedMicro = viewsCompleted * pricePerViewMicro;
        const correctUsedBudget = correctUsedMicro / 1_000_000;
        
        // Calculate correct remaining values
        const correctRemainingMicro = Math.max(0, pkg.budget_micro - correctUsedMicro);
        const correctRemainingBudget = correctRemainingMicro / 1_000_000;
        
        console.log(`   Views completed: ${viewsCompleted}`);
        console.log(`   Price per view: ${pricePerViewMicro} micro units`);
        console.log(`   Correct used micro: ${correctUsedMicro}`);
        console.log(`   Correct used budget: ${correctUsedBudget} KWD`);
        console.log(`   Correct remaining micro: ${correctRemainingMicro}`);
        console.log(`   Correct remaining budget: ${correctRemainingBudget} KWD`);
        
        // Update the package with correct values
        const [updateResult] = await sequelize.query(`
          UPDATE purchased_packages 
          SET 
            used_micro = ?,
            used_budget = ?,
            remaining_micro = ?,
            remaining_budget = ?,
            updated_at = NOW()
          WHERE id = ?
        `, {
          replacements: [
            correctUsedMicro,
            correctUsedBudget,
            correctRemainingMicro,
            correctRemainingBudget,
            pkg.id
          ],
          transaction
        });
        
        if (updateResult > 0) {
          console.log(`   ✅ Successfully corrected package ${pkg.id}`);
          correctedCount++;
        } else {
          console.log(`   ❌ Failed to update package ${pkg.id}`);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      console.log(`\n🎯 Budget cleanup completed!`);
      console.log(`   Corrected ${correctedCount} packages`);
      console.log(`   All corrupted values have been reset to valid amounts`);
      
      // Verify the fix
      console.log('\n🔍 Verifying fix...');
      
      const [verification] = await sequelize.query(`
        SELECT COUNT(*) as total_corrupted
        FROM purchased_packages 
        WHERE used_micro > 1000000000 
           OR used_budget > 1000000 
           OR remaining_micro > 1000000000
           OR remaining_budget > 1000000
      `);
      
      if (verification[0].total_corrupted === 0) {
        console.log('✅ Verification passed: No corrupted values remain!');
      } else {
        console.log(`❌ Verification failed: ${verification[0].total_corrupted} corrupted values still exist`);
      }
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error during budget correction:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Budget cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the cleanup if called directly
if (require.main === module) {
  fixCorruptedBudgets()
    .then(() => {
      console.log('\n🎯 Budget cleanup script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Budget cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixCorruptedBudgets };
