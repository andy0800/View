// backend/src/startup/databaseFix.js
// Startup database fix that runs immediately when app starts

const { sequelize } = require('../models');

async function fixDatabaseOnStartup() {
  try {
    console.log('🚀 STARTUP: Checking and fixing database schema...');
    
    // Test database connection with timeout
    const connectionPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
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

    // Check sessions table
    console.log('🔐 CHECKING SESSIONS TABLE...');
    const [sessionsExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sessions'
      );
    `);

    if (!sessionsExists[0].exists) {
      console.log('🔧 Creating sessions table...');
      await sequelize.query(`
        CREATE TABLE sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          token TEXT NOT NULL,
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ Created sessions table');

      // Add indexes for sessions table
      try {
        await sequelize.query(`
          CREATE INDEX idx_sessions_user_id ON sessions(user_id);
        `);
        console.log('✅ Added sessions user_id index');
      } catch (err) {
        console.log('⚠️ sessions user_id index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX idx_sessions_token ON sessions(token);
        `);
        console.log('✅ Added sessions token index');
      } catch (err) {
        console.log('⚠️ sessions token index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
        `);
        console.log('✅ Added sessions expires_at index');
      } catch (err) {
        console.log('⚠️ sessions expires_at index already exists');
      }
    } else {
      console.log('✅ sessions table already exists');
    }

    // Check otp_codes table
    console.log('📱 CHECKING OTP_CODES TABLE...');
    const [otpCodesExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'otp_codes'
      );
    `);

    if (!otpCodesExists[0].exists) {
      console.log('🔧 Creating otp_codes table...');
      await sequelize.query(`
        CREATE TABLE otp_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone VARCHAR(20) NOT NULL,
          code VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);
      console.log('✅ Created otp_codes table');

      // Add indexes for otp_codes table
      try {
        await sequelize.query(`
          CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
        `);
        console.log('✅ Added otp_codes phone index');
      } catch (err) {
        console.log('⚠️ otp_codes phone index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
        `);
        console.log('✅ Added otp_codes expires_at index');
      } catch (err) {
        console.log('⚠️ otp_codes expires_at index already exists');
      }
    } else {
      console.log('✅ otp_codes table already exists');
    }

    // Check notifications table
    console.log('🔔 CHECKING NOTIFICATIONS TABLE...');
    const [notificationsExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);

    if (!notificationsExists[0].exists) {
      console.log('🔧 Creating notifications table...');
      await sequelize.query(`
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'withdrawal', 'appeal', 'kyc', 'system', 'alert')),
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
          priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
          metadata JSONB,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ Created notifications table');

      // Add indexes for notifications table
      try {
        await sequelize.query(`
          CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        `);
        console.log('✅ Added notifications user_id index');
      } catch (err) {
        console.log('⚠️ notifications user_id index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX idx_notifications_type ON notifications(type);
        `);
        console.log('✅ Added notifications type index');
      } catch (err) {
        console.log('⚠️ notifications type index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX idx_notifications_status ON notifications(status);
        `);
        console.log('✅ Added notifications status index');
      } catch (err) {
        console.log('⚠️ notifications status index already exists');
      }
    } else {
      console.log('✅ notifications table already exists');
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
    console.log('⚠️ Database fix failed, but continuing app startup...');
    console.log('⚠️ Some features may not work until database is manually fixed');
    
    // Don't throw - let the app start even if fix fails
    // This prevents the entire server from crashing
    return false;
  }
  
  return true;
}

module.exports = { fixDatabaseOnStartup };
