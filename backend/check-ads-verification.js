require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkAdsVerification() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check ads with verification status
    const [ads] = await sequelize.query(`
      SELECT 
        id, title, status, is_active, verification_status, 
        advertiser_id, package_id, purchased_package_id, section
      FROM ads 
      WHERE title LIKE 'Comprehensive Test Ad%'
      ORDER BY title
    `);

    console.log(`\n📹 Ads found: ${ads.length}`);
    ads.forEach((ad, index) => {
      console.log(`\n--- Ad ${index + 1} ---`);
      console.log(`   ID: ${ad.id}`);
      console.log(`   Title: ${ad.title}`);
      console.log(`   Status: ${ad.status}`);
      console.log(`   Active: ${ad.is_active}`);
      console.log(`   Verification Status: ${ad.verification_status}`);
      console.log(`   Advertiser ID: ${ad.advertiser_id}`);
      console.log(`   Package ID: ${ad.package_id}`);
      console.log(`   Purchased Package ID: ${ad.purchased_package_id}`);
      console.log(`   Section: ${ad.section}`);
    });

    // Check viewer visibility requirements
    console.log('\n🔍 VIEWER VISIBILITY CHECK:');
    ads.forEach((ad, index) => {
      const issues = [];
      
      if (ad.status !== 'active') issues.push(`Status: ${ad.status} (should be 'active')`);
      if (!ad.is_active) issues.push('is_active: false (should be true)');
      if (ad.verification_status !== 'approved') issues.push(`Verification: ${ad.verification_status} (should be 'approved')`);
      if (!ad.section) issues.push('Missing section');
      
      if (issues.length > 0) {
        console.log(`   Ad ${index + 1}: ❌ ${issues.join(', ')}`);
      } else {
        console.log(`   Ad ${index + 1}: ✅ All requirements met`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAdsVerification();
