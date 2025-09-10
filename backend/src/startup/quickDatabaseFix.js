// backend/src/startup/quickDatabaseFix.js
// Quick database fix that only creates the most critical tables

const { sequelize } = require('../models');

async function quickDatabaseFix() {
  try {
    console.log('⚡ QUICK STARTUP: Creating critical tables only...');
    
    // Test database connection with short timeout
    const connectionPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Database connection established');

    // Only create the most critical tables that are causing 502 errors
    const criticalTables = [
      {
        name: 'sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS sessions (
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
        `
      },
      {
        name: 'otp_codes',
        sql: `
          CREATE TABLE IF NOT EXISTS otp_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            phone VARCHAR(20) NOT NULL,
            code VARCHAR(10) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL
          );
        `
      },
      {
        name: 'sections',
        sql: `
          CREATE TABLE IF NOT EXISTS sections (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) NOT NULL UNIQUE,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            color VARCHAR(20),
            is_active BOOLEAN NOT NULL DEFAULT true,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      },
      {
        name: 'purchased_packages',
        sql: `
          CREATE TABLE IF NOT EXISTS purchased_packages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            package_id UUID NOT NULL,
            total_budget_micro BIGINT NOT NULL DEFAULT 0,
            remaining_budget_micro BIGINT NOT NULL DEFAULT 0,
            remaining_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            estimated_views INTEGER NOT NULL DEFAULT 0,
            actual_views INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      },
      {
        name: 'advertiser_packages',
        sql: `
          CREATE TABLE IF NOT EXISTS advertiser_packages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            duration INTEGER NOT NULL,
            price_per_view_micro BIGINT NOT NULL DEFAULT 0,
            min_budget_micro BIGINT NOT NULL DEFAULT 0,
            budget_increment_micro BIGINT NOT NULL DEFAULT 0,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      },
      {
        name: 'ads',
        sql: `
          CREATE TABLE IF NOT EXISTS ads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advertiser_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            package_id UUID,
            purchased_package_id UUID REFERENCES purchased_packages(id) ON UPDATE CASCADE ON DELETE SET NULL,
            media_url TEXT,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            section VARCHAR(50),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            is_active BOOLEAN NOT NULL DEFAULT true,
            image_key VARCHAR(200),
            link TEXT,
            cta_link TEXT,
            cta_text VARCHAR(100),
            cta_enabled BOOLEAN NOT NULL DEFAULT false,
            verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            verified_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
            verified_at TIMESTAMP WITH TIME ZONE,
            admin_notes TEXT,
            rejection_reason TEXT,
            submitted_for_review_at TIMESTAMP WITH TIME ZONE,
            review_deadline TIMESTAMP WITH TIME ZONE,
            appeal_deadline TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      },
      {
        name: 'transactions',
        sql: `
          CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            from_wallet_id UUID REFERENCES wallets(id) ON UPDATE CASCADE ON DELETE SET NULL,
            to_wallet_id UUID REFERENCES wallets(id) ON UPDATE CASCADE ON DELETE SET NULL,
            type VARCHAR(50) NOT NULL,
            amount_micro BIGINT NOT NULL DEFAULT 0,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            description TEXT,
            reference_id VARCHAR(100),
            status VARCHAR(20) NOT NULL DEFAULT 'completed',
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      },
      {
        name: 'view_events',
        sql: `
          CREATE TABLE IF NOT EXISTS view_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ad_id UUID NOT NULL REFERENCES ads(id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            purchased_package_id UUID REFERENCES purchased_packages(id) ON UPDATE CASCADE ON DELETE SET NULL,
            package_id UUID,
            proof_token VARCHAR(100),
            proof_token_expires_at TIMESTAMP WITH TIME ZONE,
            charged_micro BIGINT NOT NULL DEFAULT 0,
            viewer_reward_micro BIGINT NOT NULL DEFAULT 0,
            company_share_micro BIGINT NOT NULL DEFAULT 0,
            viewer_reward DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            company_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            is_completed BOOLEAN NOT NULL DEFAULT false,
            watched_duration_ms INTEGER NOT NULL DEFAULT 0,
            required_duration_ms INTEGER NOT NULL DEFAULT 0,
            completion_duration DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            required_duration DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      }
    ];

    // Create critical tables quickly
    for (const table of criticalTables) {
      try {
        await sequelize.query(table.sql);
        console.log(`✅ Created ${table.name} table`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`✅ ${table.name} table already exists`);
        } else {
          console.log(`⚠️ Error creating ${table.name} table:`, err.message);
        }
      }
    }

    // Add wallet columns if missing (quick check)
    try {
      const [walletColumns] = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'balance_micro'
      `);
      
      if (walletColumns.length === 0) {
        console.log('🔧 Adding critical wallet columns...');
        await sequelize.query(`
          ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance_micro BIGINT NOT NULL DEFAULT 0;
        `);
        await sequelize.query(`
          ALTER TABLE wallets ADD COLUMN IF NOT EXISTS held_micro BIGINT NOT NULL DEFAULT 0;
        `);
        await sequelize.query(`
          ALTER TABLE wallets ADD COLUMN IF NOT EXISTS confirmed_points INTEGER NOT NULL DEFAULT 0;
        `);
        await sequelize.query(`
          ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pending_points INTEGER NOT NULL DEFAULT 0;
        `);
        console.log('✅ Added wallet columns');
      } else {
        console.log('✅ Wallet columns already exist');
      }
    } catch (err) {
      console.log('⚠️ Wallet column fix error:', err.message);
    }

    // Add default sections if sections table is empty
    try {
      const [sectionCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM sections;
      `);
      
      if (sectionCount[0].count === '0') {
        console.log('🔧 Adding default sections...');
        await sequelize.query(`
          INSERT INTO sections (key, title, description, icon, color, sort_order) VALUES
          ('entertainment', 'Entertainment', 'Fun and engaging content', 'play_circle', '#FF6B6B', 1),
          ('technology', 'Technology', 'Latest tech news and reviews', 'computer', '#4ECDC4', 2),
          ('lifestyle', 'Lifestyle', 'Health, fashion, and daily life', 'favorite', '#45B7D1', 3),
          ('business', 'Business', 'Finance, entrepreneurship, and markets', 'business', '#96CEB4', 4),
          ('education', 'Education', 'Learning and skill development', 'school', '#FFEAA7', 5)
          ON CONFLICT (key) DO NOTHING;
        `);
        console.log('✅ Added default sections');
      } else {
        console.log('✅ Sections already exist');
      }
    } catch (err) {
      console.log('⚠️ Sections data error:', err.message);
    }

    // Add default advertiser packages if empty
    try {
      const [packageCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM advertiser_packages;
      `);
      
      if (packageCount[0].count === '0') {
        console.log('🔧 Adding default advertiser packages...');
        await sequelize.query(`
          INSERT INTO advertiser_packages (id, name, duration, price_per_view_micro, min_budget_micro, budget_increment_micro, description) VALUES
          (gen_random_uuid(), 'Basic Package', 15, 100000, 10000000, 1000000, 'Basic ad package with 15-second duration'),
          (gen_random_uuid(), 'Standard Package', 30, 200000, 20000000, 2000000, 'Standard ad package with 30-second duration'),
          (gen_random_uuid(), 'Premium Package', 60, 300000, 30000000, 3000000, 'Premium ad package with 60-second duration')
          ON CONFLICT (id) DO NOTHING;
        `);
        console.log('✅ Added default advertiser packages');
      } else {
        console.log('✅ Advertiser packages already exist');
      }
    } catch (err) {
      console.log('⚠️ Advertiser packages data error:', err.message);
    }

    // Fix existing tables that might be missing columns
    try {
      console.log('🔧 Checking and fixing existing table columns...');
      
      // Fix sections table if it exists but missing columns
      await sequelize.query(`
        ALTER TABLE sections ADD COLUMN IF NOT EXISTS title VARCHAR(100);
      `);
      await sequelize.query(`
        ALTER TABLE sections ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE sections ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
      `);
      await sequelize.query(`
        ALTER TABLE sections ADD COLUMN IF NOT EXISTS color VARCHAR(20);
      `);
      await sequelize.query(`
        ALTER TABLE sections ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      `);
      await sequelize.query(`
        ALTER TABLE sections ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
      `);
      
      // Fix ads table if it exists but missing columns
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS purchased_package_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS package_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS media_url TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS title VARCHAR(200);
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS section VARCHAR(50);
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_key VARCHAR(200);
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS link TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_link TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100);
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_enabled BOOLEAN NOT NULL DEFAULT false;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'pending';
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS verified_by UUID;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP WITH TIME ZONE;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMP WITH TIME ZONE;
      `);
      await sequelize.query(`
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS appeal_deadline TIMESTAMP WITH TIME ZONE;
      `);
      
      // Fix transactions table if it exists but missing columns
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS from_wallet_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS to_wallet_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_micro BIGINT NOT NULL DEFAULT 0;
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed';
      `);
      await sequelize.query(`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;
      `);
      
      // Fix view_events table if it exists but missing columns
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS ad_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS purchased_package_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS package_id UUID;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS proof_token VARCHAR(100);
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS proof_token_expires_at TIMESTAMP WITH TIME ZONE;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS charged_micro BIGINT NOT NULL DEFAULT 0;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS viewer_reward_micro BIGINT NOT NULL DEFAULT 0;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS company_share_micro BIGINT NOT NULL DEFAULT 0;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS viewer_reward DECIMAL(10,2) NOT NULL DEFAULT 0.00;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS company_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT false;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS watched_duration_ms INTEGER NOT NULL DEFAULT 0;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS required_duration_ms INTEGER NOT NULL DEFAULT 0;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS completion_duration DECIMAL(5,2) NOT NULL DEFAULT 0.00;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS required_duration DECIMAL(5,2) NOT NULL DEFAULT 0.00;
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
      `);
      await sequelize.query(`
        ALTER TABLE view_events ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
      `);
      
      console.log('✅ Fixed existing table columns');
    } catch (err) {
      console.log('⚠️ Column fix error:', err.message);
    }

    console.log('⚡ QUICK DATABASE FIX COMPLETED!');
    return true;

  } catch (error) {
    console.error('❌ QUICK DATABASE FIX ERROR:', error.message);
    console.log('⚠️ Quick fix failed, but continuing app startup...');
    return false;
  }
}

module.exports = { quickDatabaseFix };
