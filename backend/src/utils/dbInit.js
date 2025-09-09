// backend/src/utils/dbInit.js
// Database initialization utility for production

async function checkAndAddMissingColumns(sequelize) {
  console.log('🔍 Checking for missing columns in existing tables...');
  
  try {
    // Check if is_active column exists in users table
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
      AND table_schema = 'public'
    `);
    
    if (results.length === 0) {
      console.log('❌ is_active column missing in users table. Adding it now...');
      
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      
      await sequelize.query(`
        COMMENT ON COLUMN users.is_active IS 'Account status - whether user is active'
      `);
      
      console.log('✅ is_active column added to users table');
    } else {
      console.log('ℹ️ is_active column already exists in users table');
    }
    
    // Check if verified_at column exists in users table
    const [verifiedAtResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'verified_at'
      AND table_schema = 'public'
    `);
    
    if (verifiedAtResults.length === 0) {
      console.log('❌ verified_at column missing in users table. Adding it now...');
      
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN verified_at TIMESTAMPTZ
      `);
      
      console.log('✅ verified_at column added to users table');
    } else {
      console.log('ℹ️ verified_at column already exists in users table');
    }
    
    // Check if verified_by column exists in users table
    const [verifiedByResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'verified_by'
      AND table_schema = 'public'
    `);
    
    if (verifiedByResults.length === 0) {
      console.log('❌ verified_by column missing in users table. Adding it now...');
      
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN verified_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
      `);
      
      console.log('✅ verified_by column added to users table');
    } else {
      console.log('ℹ️ verified_by column already exists in users table');
    }
    
    console.log('✅ Column check completed');
    
  } catch (error) {
    console.error('❌ Error checking/adding missing columns:', error.message);
    throw error;
  }
}

async function initializeDatabase(sequelize) {
  console.log('🔄 Initializing database tables...');
  
  try {
    // Check if tables exist first
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'videos', 'view_events', 'wallets', 'sections', 'advertiser_packages');
    `);
    
    const existingTables = results.map(row => row.table_name);
    console.log('📊 Existing tables:', existingTables);
    
    // Create missing tables
    const requiredTables = ['users', 'videos', 'view_events', 'wallets', 'sections', 'advertiser_packages'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables already exist');
      
      // Check for missing columns in existing tables
      await checkAndAddMissingColumns(sequelize);
      
      return true;
    }
    
    console.log('🔄 Creating missing tables:', missingTables);
    
    // Create tables only if they don't exist
    if (missingTables.includes('users')) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(255) CHECK (role IN ('viewer', 'advertiser', 'admin')) DEFAULT 'viewer',
          kyc_status VARCHAR(255) CHECK (kyc_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
          company_name VARCHAR(255),
          license_number VARCHAR(255),
          signatory_name VARCHAR(255),
          license_doc_key VARCHAR(255),
          verified_at TIMESTAMPTZ,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Users table created');
    }
    
    if (missingTables.includes('videos')) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          url VARCHAR(255) NOT NULL,
          sections TEXT[],
          views INTEGER DEFAULT 0,
          spent DECIMAL(10, 2) DEFAULT 0,
          budget DECIMAL(10, 2) DEFAULT 0,
          duration INTEGER DEFAULT 30,
          is_active BOOLEAN DEFAULT true,
          advertiser_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Videos table created');
    }
    
    if (missingTables.includes('view_events')) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS view_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          video_id UUID NOT NULL REFERENCES videos(id) ON UPDATE CASCADE ON DELETE NO ACTION,
          user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
          viewed_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ View_events table created');
    }
    
    if (missingTables.includes('wallets')) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS wallets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          balance DECIMAL(20, 3) DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Wallets table created');
    }
    
    if (missingTables.includes('sections')) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS sections (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Sections table created');
    }
    
    if (missingTables.includes('advertiser_packages')) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS advertiser_packages (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          views INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Advertiser_packages table created');
    }
    
    console.log('✅ Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
}

module.exports = { initializeDatabase };
