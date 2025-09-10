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

    console.log('⚡ QUICK DATABASE FIX COMPLETED!');
    return true;

  } catch (error) {
    console.error('❌ QUICK DATABASE FIX ERROR:', error.message);
    console.log('⚠️ Quick fix failed, but continuing app startup...');
    return false;
  }
}

module.exports = { quickDatabaseFix };
