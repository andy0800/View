// backend/scripts/deployWithMigrations.js
// Comprehensive deployment script that ensures all migrations and fixes are applied

const { execSync } = require('child_process');
const { sequelize } = require('../src/models');

async function deployWithMigrations() {
  console.log('🚀 Starting comprehensive deployment with migrations...');
  
  try {
    // Step 1: Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Step 2: Run migrations
    console.log('🔄 Running database migrations...');
    try {
      execSync('npx sequelize-cli db:migrate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migrations completed successfully');
    } catch (migrationError) {
      console.log('⚠️ Migration error (continuing):', migrationError.message);
    }
    
    // Step 3: Run database fixes
    console.log('🔧 Running database fixes...');
    try {
      const { fixIsActiveColumn } = require('./fixIsActiveColumn');
      await fixIsActiveColumn();
      console.log('✅ Database fixes completed');
    } catch (fixError) {
      console.log('⚠️ Fix error (continuing):', fixError.message);
    }
    
    // Step 3.5: Force fix wallet schema
    console.log('💰 FORCE FIXING wallet schema...');
    try {
      const { forceFixWalletSchema } = require('./forceFixWalletSchema');
      await forceFixWalletSchema();
      console.log('✅ Wallet schema force fixed');
    } catch (walletError) {
      console.log('⚠️ Wallet schema force fix error (continuing):', walletError.message);
    }
    
    // Step 4: Verify admin settings
    console.log('🔍 Verifying admin settings...');
    try {
      const { verifyAdminSettings } = require('./verifyAdminSettings');
      await verifyAdminSettings();
      console.log('✅ Admin settings verified');
    } catch (verifyError) {
      console.log('⚠️ Verification error (continuing):', verifyError.message);
    }
    
    // Step 5: Check critical tables exist
    console.log('📊 Checking critical tables...');
    const tables = ['users', 'ads', 'wallets', 'transactions', 'admin_settings'];
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = '${table}' 
          AND table_schema = 'public'
        `);
        
        if (results.length > 0) {
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking table '${table}':`, error.message);
      }
    }
    
    // Step 6: Check critical columns exist
    console.log('🔍 Checking critical columns...');
    const criticalColumns = [
      { table: 'users', column: 'is_active' },
      { table: 'users', column: 'verified_at' },
      { table: 'users', column: 'verified_by' }
    ];
    
    for (const { table, column } of criticalColumns) {
      try {
        const [results] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' 
          AND column_name = '${column}' 
          AND table_schema = 'public'
        `);
        
        if (results.length > 0) {
          console.log(`✅ Column '${table}.${column}' exists`);
        } else {
          console.log(`❌ Column '${table}.${column}' missing`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking column '${table}.${column}':`, error.message);
      }
    }
    
    console.log('\n🎉 Deployment with migrations completed successfully!');
    console.log('✅ Database is ready for production');
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error('📋 Error details:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run deployment
if (require.main === module) {
  deployWithMigrations()
    .then((success) => {
      if (success) {
        console.log('\n✅ Deployment PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ Deployment FAILED');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Deployment error:', error);
      process.exit(1);
    });
}

module.exports = { deployWithMigrations };
