// backend/scripts/forceWipeAllData.js
// ⚠️ WARNING: This script will FORCE DELETE ALL DATA from the database
// Use with extreme caution - this action cannot be undone!

const { sequelize } = require('../src/models');

async function forceWipeAllData() {
  try {
    console.log('🚨 STARTING FORCE DATABASE WIPE...');
    console.log('⚠️  This will FORCE DELETE ALL DATA from ALL tables!');
    
    // First, let's see what's actually in the database
    console.log('\n🔍 Checking current database state...');
    
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
    
    // Check current record counts
    console.log('\n📊 Current record counts:');
    let totalRecords = 0;
    for (const table of tables) {
      try {
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(countResult[0][0].count);
        totalRecords += count;
        console.log(`  ${table}: ${count} records`);
      } catch (error) {
        console.log(`  ${table}: Error checking count - ${error.message}`);
      }
    }
    
    if (totalRecords === 0) {
      console.log('\n✅ Database is already empty!');
      return;
    }
    
    console.log(`\n📊 Total records to delete: ${totalRecords}`);
    
    // Force disable all constraints and triggers
    console.log('\n🔓 Disabling all constraints and triggers...');
    await sequelize.query('SET session_replication_role = replica;');
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED;');
    
    // Try to disable triggers on all tables
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL;`);
      } catch (error) {
        // Ignore errors for tables without triggers
      }
    }
    
    // Force delete all data using multiple methods
    console.log('\n🧹 Starting aggressive data wipe...');
    
    for (const table of tables) {
      try {
        // Get record count before deletion
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(countResult[0][0].count);
        
        if (count > 0) {
          console.log(`\n🗑️  Wiping ${table} (${count} records)...`);
          
          // Method 1: Try TRUNCATE CASCADE first
          try {
            await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE;`);
            console.log(`  ✅ TRUNCATE CASCADE successful`);
          } catch (error) {
            console.log(`  ⚠️  TRUNCATE CASCADE failed: ${error.message}`);
            
            // Method 2: Try DELETE with CASCADE
            try {
              await sequelize.query(`DELETE FROM "${table}" CASCADE;`);
              console.log(`  ✅ DELETE CASCADE successful`);
            } catch (error) {
              console.log(`  ⚠️  DELETE CASCADE failed: ${error.message}`);
              
              // Method 3: Force delete without constraints
              try {
                await sequelize.query(`DELETE FROM "${table}";`);
                console.log(`  ✅ DELETE successful`);
              } catch (error) {
                console.log(`  ⚠️  DELETE failed: ${error.message}`);
                
                // Method 4: Drop and recreate table (nuclear option)
                try {
                  console.log(`  🚨 Attempting to drop and recreate ${table}...`);
                  const tableInfo = await sequelize.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position;`);
                  
                  // Create backup of table structure
                  const createTableSQL = await sequelize.query(`SELECT 'CREATE TABLE "${table}" (' || string_agg(column_def, ', ') || ');' as create_sql FROM (SELECT column_name || ' ' || data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END || CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END as column_def FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position) as cols;`);
                  
                  if (createTableSQL[0] && createTableSQL[0][0] && createTableSQL[0][0].create_sql) {
                    const createSQL = createTableSQL[0][0].create_sql;
                    
                    // Drop the table
                    await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
                    console.log(`  ✅ Table ${table} dropped`);
                    
                    // Recreate the table
                    await sequelize.query(createSQL);
                    console.log(`  ✅ Table ${table} recreated`);
                  }
                } catch (dropError) {
                  console.log(`  ❌ Drop and recreate failed: ${dropError.message}`);
                }
              }
            }
          }
          
          // Verify deletion
          const verifyResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
          const remainingCount = parseInt(verifyResult[0][0].count);
          
          if (remainingCount === 0) {
            console.log(`  🎉 ${table} successfully wiped!`);
          } else {
            console.log(`  ⚠️  ${table} still has ${remainingCount} records`);
          }
        } else {
          console.log(`  ℹ️  ${table}: Already empty`);
        }
      } catch (error) {
        console.log(`  ❌ Error processing ${table}: ${error.message}`);
      }
    }
    
    // Re-enable constraints and triggers
    console.log('\n🔒 Re-enabling constraints and triggers...');
    await sequelize.query('SET session_replication_role = DEFAULT;');
    await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE;');
    
    // Re-enable triggers on all tables
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL;`);
      } catch (error) {
        // Ignore errors for tables without triggers
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    let finalTotalRecords = 0;
    for (const table of tables) {
      try {
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(countResult[0][0].count);
        finalTotalRecords += count;
        
        if (count > 0) {
          console.log(`  ⚠️  ${table}: Still has ${count} records`);
        } else {
          console.log(`  ✅ ${table}: Confirmed empty`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking ${table}: ${error.message}`);
      }
    }
    
    if (finalTotalRecords === 0) {
      console.log('\n🎉 SUCCESS: All data has been completely wiped!');
      console.log('📊 Total records remaining: 0');
      console.log('🗄️  Database schema preserved and ready for fresh data');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain');
      console.log(`📊 Total records remaining: ${finalTotalRecords}`);
      console.log('🔄 You may need to manually clean remaining data');
    }
    
  } catch (error) {
    console.error('❌ ERROR during force data wipe:', error);
    throw error;
  } finally {
    // Always close the connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the force wipe function
if (require.main === module) {
  forceWipeAllData()
    .then(() => {
      console.log('\n✅ Force data wipe completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Force data wipe failed:', error);
      process.exit(1);
    });
}

module.exports = forceWipeAllData;
