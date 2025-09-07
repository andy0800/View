require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkPurchasedPackages() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check purchased packages for our test ads
    const [packages] = await sequelize.query(`
      SELECT 
        pp.id,
        pp.advertiser_id,
        pp.package_id,
        pp.remaining_budget,
        pp.status,
        pp.created_at,
        a.title as ad_title,
        a.id as ad_id,
        ap.name as package_name
      FROM purchased_packages pp
      LEFT JOIN ads a ON a.purchased_package_id = pp.id
      LEFT JOIN advertiser_packages ap ON pp.package_id = ap.id
      WHERE a.title LIKE 'Comprehensive Test Ad%'
      ORDER BY a.title
    `);

    console.log(`\n📦 Purchased Packages found: ${packages.length}`);
    packages.forEach((pkg, index) => {
      console.log(`\n--- Package ${index + 1} ---`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Advertiser ID: ${pkg.advertiser_id}`);
      console.log(`   Package ID: ${pkg.package_id}`);
      console.log(`   Package Name: ${pkg.package_name}`);
      console.log(`   Remaining Budget: ${pkg.remaining_budget}`);
      console.log(`   Status: ${pkg.status}`);
      console.log(`   Ad Title: ${pkg.ad_title}`);
      console.log(`   Ad ID: ${pkg.ad_id}`);
      console.log(`   Created: ${pkg.created_at}`);
      
      // Check if this package would be visible to viewers
      const issues = [];
      if (pkg.remaining_budget <= 0) issues.push('Remaining budget <= 0');
      if (pkg.status !== 'active') issues.push(`Status: ${pkg.status} (should be 'active')`);
      
      if (issues.length > 0) {
        console.log(`   ❌ Viewer Visibility Issues: ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ All requirements met for viewer visibility`);
      }
    });

    // Check if any packages have remaining_budget > 0
    const [budgetCheck] = await sequelize.query(`
      SELECT COUNT(*) as total_packages, 
             COUNT(CASE WHEN remaining_budget > 0 THEN 1 END) as with_budget,
             COUNT(CASE WHEN remaining_budget <= 0 THEN 1 END) as without_budget
      FROM purchased_packages pp
      JOIN ads a ON a.purchased_package_id = pp.id
      WHERE a.title LIKE 'Comprehensive Test Ad%'
    `);

    console.log(`\n💰 Budget Analysis:`);
    console.log(`   Total Packages: ${budgetCheck[0].total_packages}`);
    console.log(`   With Budget > 0: ${budgetCheck[0].with_budget}`);
    console.log(`   Without Budget: ${budgetCheck[0].without_budget}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPurchasedPackages();
