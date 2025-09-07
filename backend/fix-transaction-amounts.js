#!/usr/bin/env node
// Fix existing transactions with incorrect amount values

const { sequelize, Transaction } = require('./src/models');

async function fixTransactionAmounts() {
  try {
    console.log('🔧 Starting transaction amount fixes...\n');
    
    // Get all transactions where amount equals amount_micro (indicating the bug)
    const brokenTransactions = await Transaction.findAll({
      where: sequelize.where(
        sequelize.col('amount'),
        '=',
        sequelize.col('amount_micro')
      ),
      attributes: ['id', 'amount', 'amount_micro', 'type']
    });

    console.log(`📊 Found ${brokenTransactions.length} transactions with incorrect amounts`);

    if (brokenTransactions.length === 0) {
      console.log('✅ No transactions need fixing');
      return;
    }

    // Fix each transaction
    let fixedCount = 0;
    for (const transaction of brokenTransactions) {
      const correctAmount = transaction.amount_micro / 1_000_000;
      
      await transaction.update({
        amount: correctAmount
      });
      
      console.log(`✅ Fixed transaction ${transaction.id}: ${transaction.amount} → ${correctAmount} KWD (${transaction.type})`);
      fixedCount++;
    }

    console.log(`\n🎉 Successfully fixed ${fixedCount} transactions!`);
    
    // Verify the fixes
    const verifyBroken = await Transaction.findAll({
      where: sequelize.where(
        sequelize.col('amount'),
        '=',
        sequelize.col('amount_micro')
      ),
      attributes: ['id']
    });
    
    console.log(`✅ Verification: ${verifyBroken.length} transactions still need fixing (should be 0)`);
    
  } catch (error) {
    console.error('❌ Error fixing transactions:', error);
  } finally {
    await sequelize.close();
  }
}

fixTransactionAmounts();
