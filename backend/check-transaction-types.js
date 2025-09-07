require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkTransactionTypes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check transaction types enum
    const [result] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_transactions_type)) as transaction_type
    `);

    console.log('\n📋 VALID TRANSACTION TYPES:');
    result.forEach(row => {
      console.log(`   - ${row.transaction_type}`);
    });

    // Check transaction categories enum
    const [categories] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_transactions_category)) as transaction_category
    `);

    console.log('\n📋 VALID TRANSACTION CATEGORIES:');
    categories.forEach(row => {
      console.log(`   - ${row.transaction_category}`);
    });

    // Check existing transactions
    const [existingTransactions] = await sequelize.query(`
      SELECT type, category, COUNT(*) as count
      FROM transactions 
      GROUP BY type, category
      ORDER BY type, category
    `);

    console.log('\n📊 EXISTING TRANSACTIONS:');
    existingTransactions.forEach(row => {
      console.log(`   ${row.type} (${row.category}): ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTransactionTypes();
