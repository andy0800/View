require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkViewEvents() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check view events for our test viewers
    const [viewEvents] = await sequelize.query(`
      SELECT 
        ve.id,
        ve.user_id,
        ve.ad_id,
        ve.is_completed,
        u.phone,
        u.name,
        a.title as ad_title
      FROM view_events ve
      JOIN users u ON ve.user_id = u.id
      JOIN ads a ON ve.ad_id = a.id
      WHERE u.phone LIKE '+9655001%'
      ORDER BY ve.id DESC
      LIMIT 20
    `);

    console.log(`\n👁️ View Events found: ${viewEvents.length}`);
    if (viewEvents.length > 0) {
      viewEvents.forEach((event, index) => {
        console.log(`\n--- Event ${index + 1} ---`);
        console.log(`   ID: ${event.id}`);
        console.log(`   User: ${event.name} (${event.phone})`);
        console.log(`   Ad: ${event.ad_title}`);
        console.log(`   Completed: ${event.is_completed}`);
      });
    } else {
      console.log('   No view events found for test viewers');
    }

    // Check if any test viewers have completed view events
    const [completedViews] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN ve.is_completed = true THEN 1 END) as completed_events,
        COUNT(CASE WHEN ve.is_completed = false THEN 1 END) as incomplete_events
      FROM view_events ve
      JOIN users u ON ve.user_id = u.id
      WHERE u.phone LIKE '+9655001%'
    `);

    console.log(`\n📊 View Events Summary:`);
    console.log(`   Total Events: ${completedViews[0].total_events}`);
    console.log(`   Completed: ${completedViews[0].completed_events}`);
    console.log(`   Incomplete: ${completedViews[0].incomplete_events}`);

    // Check specific test viewer
    const testViewerPhone = '+96550010003';
    const [viewerEvents] = await sequelize.query(`
      SELECT 
        ve.id,
        ve.ad_id,
        ve.is_completed,
        a.title as ad_title
      FROM view_events ve
      JOIN users u ON ve.user_id = u.id
      JOIN ads a ON ve.ad_id = a.id
      WHERE u.phone = $1
      ORDER BY ve.id DESC
    `, { bind: [testViewerPhone] });

    console.log(`\n🔍 Events for ${testViewerPhone}:`);
    if (viewerEvents.length > 0) {
      viewerEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Ad: ${event.ad_title}, Completed: ${event.is_completed}`);
      });
    } else {
      console.log('   No view events found for this viewer');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkViewEvents();
