// backend/scripts/wipeAllDataSQL.js
// ⚠️ WARNING: This script will DELETE ALL DATA from the database using SQL
// Use with extreme caution - this action cannot be undone!

const { sequelize } = require('../src/models');

async function wipeAllDataSQL() {
  try {
    console.log('🚨 STARTING COMPLETE DATABASE WIPE USING SQL...');
    console.log('⚠️  This will delete ALL data from ALL tables!');
    
    // Disable foreign key checks and triggers temporarily
    await sequelize.query('SET session_replication_role = replica;');
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED;');
    
    // Get all table names from the database
    const tablesResult = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename;
    `);
    
    const tables = tablesResult[0].map(row => row.tablename);
    console.log('📋 Tables found:', tables.join(', '));
    
    // Wipe all tables using TRUNCATE CASCADE
    console.log('\n🧹 Starting SQL-based data wipe...');
    
    for (const table of tables) {
      try {
        // Get record count before deletion
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(countResult[0][0].count);
        
        if (count > 0) {
          // Use TRUNCATE CASCADE to handle foreign key constraints
          await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE;`);
          console.log(`✅ Wiped ${table}: ${count} records deleted`);
        } else {
          console.log(`ℹ️  ${table}: No data to delete`);
        }
      } catch (error) {
        console.log(`⚠️  Error wiping ${table}:`, error.message);
      }
    }
    
    // Re-enable foreign key checks and constraints
    await sequelize.query('SET session_replication_role = DEFAULT;');
    await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE;');
    
    // Verify all tables are empty
    console.log('\n🔍 Verifying all tables are empty...');
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(countResult[0][0].count);
        totalRecords += count;
        
        if (count > 0) {
          console.log(`⚠️  ${table}: Still has ${count} records`);
        } else {
          console.log(`✅ ${table}: Confirmed empty`);
        }
      } catch (error) {
        console.log(`⚠️  Error checking ${table}:`, error.message);
      }
    }
    
    if (totalRecords === 0) {
      console.log('\n🎉 SUCCESS: All data has been completely wiped!');
      console.log('📊 Total records remaining: 0');
      console.log('🗄️  Database schema preserved and ready for fresh data');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain');
      console.log(`📊 Total records remaining: ${totalRecords}`);
    }
    
  } catch (error) {
    console.error('❌ ERROR during SQL data wipe:', error);
    throw error;
  } finally {
    // Always close the connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the wipe function
if (require.main === module) {
  wipeAllDataSQL()
    .then(() => {
      console.log('\n✅ SQL data wipe completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ SQL data wipe failed:', error);
      process.exit(1);
    });
}

module.exports = wipeAllDataSQL;
