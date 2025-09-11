// Comprehensive database verification script
const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function verifyDatabaseFixes() {
  try {
    console.log('🔍 Verifying database fixes...');
    
    // Test 1: Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test 2: Check if purchased_packages table exists and has correct structure
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'purchased_packages';
    `);
    
    if (tables.length === 0) {
      throw new Error('purchased_packages table does not exist');
    }
    console.log('✅ purchased_packages table exists');
    
    // Test 3: Check table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'purchased_packages' 
      ORDER BY ordinal_position;
    `);
    
    const requiredColumns = [
      'id', 'user_id', 'advertiser_id', 'package_id', 
      'budget_micro', 'remaining_micro', 'status'
    ];
    
    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
    }
    console.log('✅ purchased_packages table has all required columns');
    
    // Test 4: Check foreign key constraints
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'purchased_packages';
    `);
    
    console.log('✅ Foreign key constraints:');
    foreignKeys.forEach(fk => {
      console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Test 5: Check if advertiser_packages table exists
    const [advertiserPackages] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM advertiser_packages;
    `);
    console.log(`✅ advertiser_packages table has ${advertiserPackages[0].count} records`);
    
    // Test 6: Test the exact query that was failing
    const [testQuery] = await sequelize.query(`
      SELECT 
        pp.id,
        pp.advertiser_id,
        pp.status,
        pp.remaining_micro,
        ap.name as package_name
      FROM purchased_packages pp
      LEFT JOIN advertiser_packages ap ON pp.package_id = ap.id
      WHERE pp.advertiser_id = '00000000-0000-0000-0000-000000000001'
        AND pp.status = 'active'
        AND pp.remaining_micro > 0
      ORDER BY pp.purchased_at ASC
      LIMIT 5;
    `);
    
    console.log(`✅ Test query executed successfully, found ${testQuery.length} records`);
    
    // Test 7: Check users table
    const [users] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users;
    `);
    console.log(`✅ users table has ${users[0].count} records`);
    
    // Test 8: Check if admin user exists
    const [adminUser] = await sequelize.query(`
      SELECT id, role FROM users 
      WHERE id = '00000000-0000-0000-0000-000000000000' 
      OR role = 'admin';
    `);
    
    if (adminUser.length > 0) {
      console.log('✅ Admin user found:', adminUser[0]);
    } else {
      console.log('⚠️ No admin user found with expected ID or role');
    }
    
    console.log('🎉 All database verification tests passed!');
    console.log('✅ The 500 error should now be resolved');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verifyDatabaseFixes();
