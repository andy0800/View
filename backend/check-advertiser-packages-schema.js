require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkAdvertiserPackagesSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check advertiser_packages table schema
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'advertiser_packages'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Advertiser Packages Table Schema:');
    console.log('-'.repeat(70));
    results.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${column.column_default || 'none'}`);
    });

    // Also get sample data
    const [sampleData] = await sequelize.query(`
      SELECT * FROM advertiser_packages LIMIT 1;
    `);

    console.log('\n📋 Sample Package Data:');
    console.log('-'.repeat(40));
    if (sampleData.length > 0) {
      Object.entries(sampleData[0]).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAdvertiserPackagesSchema();
