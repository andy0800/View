require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkAdsSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check ads table schema
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ads' 
      ORDER BY ordinal_position
    `);

    console.log(`\n📋 ADS TABLE SCHEMA:`);
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    // Check raw ad data with only existing columns
    const [ads] = await sequelize.query(`
      SELECT 
        id, title, status, is_active, advertiser_id, package_id, 
        purchased_package_id, section, budget, remaining_budget,
        duration
      FROM ads 
      WHERE title LIKE 'Comprehensive Test Ad%'
      ORDER BY title
      LIMIT 3
    `);

    console.log(`\n📹 Sample ad data (first 3):`);
    ads.forEach((ad, index) => {
      console.log(`\n--- Ad ${index + 1} ---`);
      console.log(`   ID: ${ad.id}`);
      console.log(`   Title: ${ad.title}`);
      console.log(`   Status: ${ad.status}`);
      console.log(`   Active: ${ad.is_active}`);
      console.log(`   Advertiser ID: ${ad.advertiser_id}`);
      console.log(`   Package ID: ${ad.package_id}`);
      console.log(`   Purchased Package ID: ${ad.purchased_package_id}`);
      console.log(`   Section: ${ad.section}`);
      console.log(`   Budget: ${ad.budget}`);
      console.log(`   Remaining Budget: ${ad.remaining_budget}`);
      console.log(`   Duration: ${ad.duration}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAdsSchema();
