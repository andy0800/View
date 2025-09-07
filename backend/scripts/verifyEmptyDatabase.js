// backend/scripts/verifyEmptyDatabase.js
// Script to verify that the database is completely empty

const { sequelize } = require('../src/models');

async function verifyEmptyDatabase() {
  try {
    console.log('🔍 VERIFYING DATABASE IS COMPLETELY EMPTY...');
    
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
    
    // Check record counts for each table
    console.log('\n📊 Record count verification:');
    let totalRecords = 0;
    let tablesWithData = [];
    
    for (const table of tables) {
      try {
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(countResult[0][0].count);
        totalRecords += count;
        
        if (count > 0) {
          tablesWithData.push({ table, count });
          console.log(`  ❌ ${table}: ${count} records (SHOULD BE EMPTY!)`);
        } else {
          console.log(`  ✅ ${table}: ${count} records (empty)`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${table}: Error checking count - ${error.message}`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Total records across all tables: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('\n🎉 SUCCESS: Database is completely empty!');
      console.log('✅ All tables have 0 records');
      console.log('✅ Ready for fresh data');
    } else {
      console.log('\n⚠️  WARNING: Database still contains data!');
      console.log(`❌ ${tablesWithData.length} tables still have data:`);
      tablesWithData.forEach(({ table, count }) => {
        console.log(`   - ${table}: ${count} records`);
      });
      console.log('\n🔄 Additional cleanup may be needed');
    }
    
    // Check for any hidden data or sequences
    console.log('\n🔍 Checking for hidden data...');
    
    // Check sequences
    try {
      const sequencesResult = await sequelize.query(`
        SELECT sequence_name, last_value 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public';
      `);
      
      if (sequencesResult[0].length > 0) {
        console.log('📊 Sequences found:');
        sequencesResult[0].forEach(seq => {
          console.log(`  - ${seq.sequence_name}: last_value = ${seq.last_value}`);
        });
      } else {
        console.log('✅ No sequences found');
      }
    } catch (error) {
      console.log('⚠️  Error checking sequences:', error.message);
    }
    
    // Check for any remaining foreign key constraints
    try {
      const constraintsResult = await sequelize.query(`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public';
      `);
      
      if (constraintsResult[0].length > 0) {
        console.log('🔗 Foreign key constraints found:');
        constraintsResult[0].forEach(constraint => {
          console.log(`  - ${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });
      } else {
        console.log('✅ No foreign key constraints found');
      }
    } catch (error) {
      console.log('⚠️  Error checking constraints:', error.message);
    }
    
  } catch (error) {
    console.error('❌ ERROR during verification:', error);
    throw error;
  } finally {
    // Always close the connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the verification function
if (require.main === module) {
  verifyEmptyDatabase()
    .then(() => {
      console.log('\n✅ Database verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database verification failed:', error);
      process.exit(1);
    });
}

module.exports = verifyEmptyDatabase;
