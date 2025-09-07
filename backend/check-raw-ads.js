require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkRawAds() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check raw ad data with only existing columns
    const [ads] = await sequelize.query(`
      SELECT 
        id, title, status, is_active, advertiser_id, package_id, 
        purchased_package_id, section, budget, remaining_budget
      FROM ads 
      WHERE title LIKE 'Comprehensive Test Ad%'
      ORDER BY title
      LIMIT 3
    `);

    console.log(`\n📹 Raw ad data found: ${ads.length}`);
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
    });

    // Check package data
    const [packages] = await sequelize.query(`
      SELECT id, name, price_per_view, viewer_reward, duration, is_active
      FROM advertiser_packages 
      WHERE is_active = true
      ORDER BY name
    `);

    console.log(`\n📦 Package data found: ${packages.length}`);
    packages.forEach(pkg => {
      console.log(`   ${pkg.name}: Price: ${pkg.price_per_view}, Reward: ${pkg.viewer_reward}, Duration: ${pkg.duration}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkRawAds();
