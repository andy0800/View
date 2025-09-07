const { sequelize } = require('../src/models');

async function checkAdDataSQL() {
  try {
    console.log('🔍 Checking ad data using SQL...');
    
    // Check ads
    const adsResult = await sequelize.query('SELECT COUNT(*) as count FROM ads', { type: sequelize.QueryTypes.SELECT });
    console.log('Total ads:', adsResult[0].count);
    
    // Check advertiser packages
    const packagesResult = await sequelize.query('SELECT COUNT(*) as count FROM advertiser_packages', { type: sequelize.QueryTypes.SELECT });
    console.log('Total packages:', packagesResult[0].count);
    
    // Check purchased packages
    const purchasedResult = await sequelize.query('SELECT COUNT(*) as count FROM purchased_packages', { type: sequelize.QueryTypes.SELECT });
    console.log('Total purchased packages:', purchasedResult[0].count);
    
    // Check view events
    const viewsResult = await sequelize.query('SELECT COUNT(*) as count FROM view_events', { type: sequelize.QueryTypes.SELECT });
    console.log('Total view events:', viewsResult[0].count);
    
    // Get detailed ad data
    const adDetails = await sequelize.query(`
      SELECT 
        a.id, a.title, a.section, a.budget, a.remaining_budget, a.spent, a.views, a.status, a.verification_status,
        u.name as advertiser_name, u.phone as advertiser_phone,
        ap.name as package_name, ap.duration, ap.price_per_view,
        pp.purchased_budget, pp.remaining_budget as pp_remaining, pp.used_budget
      FROM ads a
      LEFT JOIN users u ON a.advertiser_id = u.id
      LEFT JOIN advertiser_packages ap ON a.package_id = ap.id
      LEFT JOIN purchased_packages pp ON a.purchased_package_id = pp.id
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\n📺 Ad Details:');
    adDetails.forEach(ad => {
      console.log(`  Ad ID: ${ad.id}`);
      console.log(`    Title: ${ad.title}`);
      console.log(`    Advertiser: ${ad.advertiser_name} (${ad.advertiser_phone})`);
      console.log(`    Section: ${ad.section}`);
      console.log(`    Package: ${ad.package_name} (${ad.duration}s)`);
      console.log(`    Package Price per view: ${ad.price_per_view} fils`);
      console.log(`    Ad Budget: ${ad.budget} KWD`);
      console.log(`    Remaining Budget: ${ad.remaining_budget} KWD`);
      console.log(`    Spent: ${ad.spent} KWD`);
      console.log(`    Views: ${ad.views}`);
      console.log(`    Status: ${ad.status}`);
      console.log(`    Verification: ${ad.verification_status}`);
      console.log(`    Purchased Package Budget: ${ad.purchased_budget} KWD`);
      console.log(`    Purchased Package Remaining: ${ad.pp_remaining} KWD`);
      console.log(`    Purchased Package Used: ${ad.used_budget} KWD`);
      console.log('');
    });
    
    // Get package details
    const packageDetails = await sequelize.query(`
      SELECT id, name, duration, price_per_view, viewer_reward, company_fee, min_budget, budget_increment
      FROM advertiser_packages
      ORDER BY duration
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📦 Package Details:');
    packageDetails.forEach(pkg => {
      console.log(`  ${pkg.id}. ${pkg.name}`);
      console.log(`     Duration: ${pkg.duration}s`);
      console.log(`     Price per view: ${pkg.price_per_view} fils`);
      console.log(`     Viewer reward: ${pkg.viewer_reward} fils`);
      console.log(`     Company fee: ${pkg.company_fee} fils`);
      console.log(`     Min budget: ${pkg.min_budget} KWD`);
      console.log(`     Budget increment: ${pkg.budget_increment} KWD`);
      console.log('');
    });
    
    // Get purchased package details
    const purchasedDetails = await sequelize.query(`
      SELECT 
        pp.id, pp.purchased_budget, pp.remaining_budget, pp.used_budget, pp.estimated_views, pp.status,
        u.name as advertiser_name, u.phone as advertiser_phone,
        ap.name as package_name, ap.duration, ap.price_per_view
      FROM purchased_packages pp
      LEFT JOIN users u ON pp.advertiser_id = u.id
      LEFT JOIN advertiser_packages ap ON pp.package_id = ap.id
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('🛒 Purchased Package Details:');
    purchasedDetails.forEach(pp => {
      console.log(`  ID: ${pp.id}`);
      console.log(`    Advertiser: ${pp.advertiser_name} (${pp.advertiser_phone})`);
      console.log(`    Package: ${pp.package_name} (${pp.package_duration}s)`);
      console.log(`    Package Price per view: ${pp.price_per_view} fils`);
      console.log(`    Purchased Budget: ${pp.purchased_budget} KWD`);
      console.log(`    Remaining Budget: ${pp.remaining_budget} KWD`);
      console.log(`    Used Budget: ${pp.used_budget} KWD`);
      console.log(`    Estimated Views: ${pp.estimated_views}`);
      console.log(`    Status: ${pp.status}`);
      console.log('');
    });
    
    // Check for data inconsistencies
    console.log('🔍 Data Consistency Check:');
    
    // Check if ad views match view events
    for (const ad of adDetails) {
      const viewCountResult = await sequelize.query(`
        SELECT COUNT(*) as count FROM view_events 
        WHERE ad_id = ? AND is_completed = true
      `, { 
        replacements: [ad.id], 
        type: sequelize.QueryTypes.SELECT 
      });
      
      const actualViews = viewCountResult[0].count;
      if (ad.views !== actualViews) {
        console.log(`  ⚠️  Ad "${ad.title}":`);
        console.log(`    Ad.views field: ${ad.views}`);
        console.log(`    Actual completed views: ${actualViews}`);
        console.log(`    MISMATCH: ${Math.abs(ad.views - actualViews)}`);
        console.log('');
      }
    }
    
    // Check purchased package budget consistency
    for (const pp of purchasedDetails) {
      const adBudgetResult = await sequelize.query(`
        SELECT COUNT(*) as ad_count, COALESCE(SUM(budget), 0) as total_budget
        FROM ads WHERE purchased_package_id = ?
      `, { 
        replacements: [pp.id], 
        type: sequelize.QueryTypes.SELECT 
      });
      
      const adCount = adBudgetResult[0].ad_count;
      const totalAdBudget = parseFloat(adBudgetResult[0].total_budget);
      
      if (Math.abs(pp.used_budget - totalAdBudget) > 0.01) {
        console.log(`  ⚠️  Purchased Package ${pp.id}:`);
        console.log(`    Purchased Budget: ${pp.purchased_budget} KWD`);
        console.log(`    Used Budget: ${pp.used_budget} KWD`);
        console.log(`    Total ad budgets: ${totalAdBudget} KWD`);
        console.log(`    Budget inconsistency: ${Math.abs(pp.used_budget - totalAdBudget)} KWD`);
        console.log('');
      }
    }
    
    console.log('✅ SQL analysis complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdDataSQL();
