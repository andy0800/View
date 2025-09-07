const { sequelize } = require('../src/models');

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    results.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    
    console.log(`\n📊 Total tables: ${results.length}`);
    
    // Check specific advertiser-related tables
    const advertiserTables = ['users', 'wallets', 'ads', 'advertiser_packages', 'purchased_packages', 'transactions', 'view_events'];
    
    console.log('\n🎯 Checking advertiser-related tables:');
    advertiserTables.forEach(table => {
      const exists = results.some(row => row.table_name === table);
      console.log(`  • ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database tables:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseTables();
