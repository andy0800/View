require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkPurchasedPackageSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check purchased_packages table schema
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'purchased_packages'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Purchased Packages Table Schema:');
    console.log('-'.repeat(70));
    results.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${column.column_default || 'none'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPurchasedPackageSchema();
