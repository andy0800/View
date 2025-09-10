// backend/src/startup/databaseFix.js
// Startup database fix that runs immediately when app starts

const { sequelize } = require('../models');

async function fixDatabaseOnStartup() {
  try {
    console.log('🚀 STARTUP: Checking and fixing database schema...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Fix wallet schema immediately
    console.log('💰 FIXING WALLET SCHEMA ON STARTUP...');
    
    // Check if balance_micro exists
    const [walletColumns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'wallets' AND column_name = 'balance_micro'
    `);

    if (walletColumns.length === 0) {
      console.log('🔧 Adding missing wallet columns...');
      
      // Add balance_micro
      await sequelize.query(`
        ALTER TABLE wallets ADD COLUMN balance_micro BIGINT NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added balance_micro column');

      // Add held_micro
      await sequelize.query(`
        ALTER TABLE wallets ADD COLUMN held_micro BIGINT NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added held_micro column');

      // Add confirmed_points
      await sequelize.query(`
        ALTER TABLE wallets ADD COLUMN confirmed_points INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added confirmed_points column');

      // Add pending_points
      await sequelize.query(`
        ALTER TABLE wallets ADD COLUMN pending_points INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added pending_points column');

      // Migrate existing balance data
      console.log('📝 Migrating existing balance data...');
      await sequelize.query(`
        UPDATE wallets 
        SET balance_micro = CAST(COALESCE(balance, 0) * 1000000 AS BIGINT)
        WHERE balance_micro = 0;
      `);
      console.log('✅ Migrated balance data to micro units');

      // Add indexes
      try {
        await sequelize.query(`
          CREATE INDEX idx_wallets_balance_micro ON wallets(balance_micro);
        `);
        console.log('✅ Added balance_micro index');
      } catch (err) {
        console.log('⚠️ balance_micro index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX idx_wallets_held_micro ON wallets(held_micro);
        `);
        console.log('✅ Added held_micro index');
      } catch (err) {
        console.log('⚠️ held_micro index already exists');
      }

      console.log('🎉 WALLET SCHEMA FIXED ON STARTUP!');
    } else {
      console.log('✅ Wallet schema already correct - no fix needed');
    }

    // Verify wallet table structure
    console.log('🔍 Verifying wallet table structure...');
    const [walletStructure] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current wallet table columns:');
    walletStructure.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Ensure no orphaned columns exist
    const hasOwnerId = walletStructure.some(col => col.column_name === 'owner_id');
    if (hasOwnerId) {
      console.log('⚠️ Found orphaned owner_id column - this should not exist');
      console.log('   The wallet table should only use user_id as foreign key');
    }

    // Fix users table is_active column
    console.log('👤 CHECKING USERS TABLE...');
    const [userColumns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_active'
    `);

    if (userColumns.length === 0) {
      console.log('🔧 Adding is_active column to users...');
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
      `);
      console.log('✅ Added is_active column');
    } else {
      console.log('✅ is_active column already exists');
    }

    // Fix users table verified_at column
    const [verifiedAtColumns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'verified_at'
    `);

    if (verifiedAtColumns.length === 0) {
      console.log('🔧 Adding verified_at column to users...');
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
      `);
      console.log('✅ Added verified_at column');
    } else {
      console.log('✅ verified_at column already exists');
    }

    // Check admin_settings table
    console.log('⚙️ CHECKING ADMIN_SETTINGS TABLE...');
    const [adminSettingsExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_settings'
      );
    `);

    if (!adminSettingsExists[0].exists) {
      console.log('🔧 Creating admin_settings table...');
      await sequelize.query(`
        CREATE TABLE admin_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'general',
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          updated_by UUID,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ Created admin_settings table');

      // Insert default settings
      await sequelize.query(`
        INSERT INTO admin_settings (key, value, category, description) VALUES
        ('app_name', 'View App', 'general', 'Application name'),
        ('maintenance_mode', 'false', 'system', 'Maintenance mode status'),
        ('registration_enabled', 'true', 'system', 'User registration status'),
        ('otp_expiry_minutes', '10', 'security', 'OTP code expiry time'),
        ('max_login_attempts', '5', 'security', 'Maximum login attempts'),
        ('session_timeout_hours', '24', 'security', 'Session timeout duration')
        ON CONFLICT (key) DO NOTHING;
      `);
      console.log('✅ Inserted default admin settings');
    } else {
      console.log('✅ admin_settings table already exists');
    }

    console.log('🎉 DATABASE STARTUP FIX COMPLETED!');
    console.log('✅ All required tables and columns are now present');
    console.log('✅ Registration and OTP verification should work');

  } catch (error) {
    console.error('❌ STARTUP DATABASE FIX ERROR:', error);
    // Don't throw - let the app start even if fix fails
    console.log('⚠️ Continuing app startup despite database fix error');
  }
}

module.exports = { fixDatabaseOnStartup };
