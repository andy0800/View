// backend/src/startup/completeDatabaseRebuild.js
'use strict';

const { sequelize } = require('../models');

/**
 * COMPLETE DATABASE REBUILD SYSTEM
 * 
 * This is a bullet-proof database rebuild system that:
 * 1. Drops and recreates ALL tables in correct order
 * 2. Creates ALL missing tables and columns
 * 3. Sets up ALL foreign key relationships
 * 4. Populates with essential default data
 * 5. Handles both fresh and existing databases
 * 6. Runs automatically on deployment startup
 */

async function completeDatabaseRebuild() {
  console.log('🚀 STARTING COMPLETE DATABASE REBUILD...');
  console.log('⚠️  This will recreate ALL tables and data!');
  
  try {
    // Step 1: Drop all tables in reverse dependency order
    await dropAllTables();
    
    // Step 2: Create all tables in correct dependency order
    await createAllTables();
    
    // Step 3: Create all indexes for performance
    await createAllIndexes();
    
    // Step 4: Populate with essential default data
    await populateDefaultData();
    
    // Step 5: Verify database integrity
    await verifyDatabaseIntegrity();
    
    console.log('🎉 COMPLETE DATABASE REBUILD SUCCESSFUL!');
    return true;
    
  } catch (error) {
    console.error('❌ DATABASE REBUILD FAILED:', error);
    throw error;
  }
}

async function dropAllTables() {
  console.log('🗑️  Dropping all existing tables...');
  
  const dropOrder = [
    // Drop in reverse dependency order
    'ad_verification_history',
    'ad_appeals', 
    'comment_likes',
    'comments',
    'view_events',
    'transactions',
    'withdrawals',
    'notifications',
    'sessions',
    'otp_codes',
    'admin_settings',
    'ads',
    'purchased_packages',
    'advertiser_packages',
    'sections',
    'company_wallets',
    'wallets',
    'users',
    'advertisers',
    'viewers',
    'videos'
  ];
  
  for (const tableName of dropOrder) {
    try {
      await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      console.log(`✅ Dropped table: ${tableName}`);
    } catch (err) {
      console.log(`⚠️  Could not drop ${tableName}:`, err.message);
    }
  }
}

async function createAllTables() {
  console.log('🏗️  Creating all tables...');
  
  // 1. USERS TABLE (Core table - referenced by all others)
  await sequelize.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'advertiser', 'admin')),
      civil_id VARCHAR(20) UNIQUE,
      kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
      civil_front_key VARCHAR(255),
      civil_back_key VARCHAR(255),
      company_name VARCHAR(255),
      license_number VARCHAR(100),
      signatory_name VARCHAR(255),
      license_doc_key VARCHAR(255),
      verified_at TIMESTAMP WITH TIME ZONE,
      verified_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created users table');

  // 2. WALLETS TABLE
  await sequelize.query(`
    CREATE TABLE wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      balance_micro BIGINT NOT NULL DEFAULT 0,
      held_micro BIGINT NOT NULL DEFAULT 0,
      confirmed_points INTEGER NOT NULL DEFAULT 0,
      pending_points INTEGER NOT NULL DEFAULT 0,
      balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);
  console.log('✅ Created wallets table');

  // 3. SECTIONS TABLE
  await sequelize.query(`
    CREATE TABLE sections (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      color VARCHAR(20) DEFAULT '#1976d2',
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      ad_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created sections table');

  // 4. ADVERTISER_PACKAGES TABLE
  await sequelize.query(`
    CREATE TABLE advertiser_packages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      duration INTEGER NOT NULL,
      price_per_view_micro BIGINT NOT NULL DEFAULT 0,
      min_budget_micro BIGINT NOT NULL DEFAULT 300000000,
      budget_increment_micro BIGINT NOT NULL DEFAULT 100000000,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created advertiser_packages table');

  // 5. PURCHASED_PACKAGES TABLE
  await sequelize.query(`
    CREATE TABLE purchased_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      package_id INTEGER NOT NULL REFERENCES advertiser_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      total_budget_micro BIGINT NOT NULL DEFAULT 0,
      remaining_budget_micro BIGINT NOT NULL DEFAULT 0,
      remaining_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      estimated_views INTEGER NOT NULL DEFAULT 0,
      actual_views INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
      purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created purchased_packages table');

  // 6. ADS TABLE
  await sequelize.query(`
    CREATE TABLE ads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      advertiser_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      package_id INTEGER REFERENCES advertiser_packages(id) ON UPDATE CASCADE ON DELETE SET NULL,
      purchased_package_id UUID NOT NULL REFERENCES purchased_packages(id) ON UPDATE CASCADE ON DELETE SET NULL,
      media_url TEXT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      section VARCHAR(50),
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'completed', 'expired')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      image_key VARCHAR(200),
      link TEXT,
      cta_link TEXT,
      cta_text VARCHAR(100) DEFAULT 'Learn More',
      cta_enabled BOOLEAN NOT NULL DEFAULT true,
      verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'under_appeal')),
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
  `);
  console.log('✅ Created ads table');

  // 7. VIEW_EVENTS TABLE
  await sequelize.query(`
    CREATE TABLE view_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL REFERENCES ads(id) ON UPDATE CASCADE ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      purchased_package_id UUID NOT NULL REFERENCES purchased_packages(id) ON UPDATE CASCADE ON DELETE SET NULL,
      package_id INTEGER NOT NULL REFERENCES advertiser_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      proof_token VARCHAR(255) NOT NULL UNIQUE,
      proof_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      charged_micro BIGINT NOT NULL DEFAULT 0,
      viewer_reward_micro BIGINT NOT NULL DEFAULT 0,
      company_share_micro BIGINT NOT NULL DEFAULT 0,
      viewer_reward DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      company_fee DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      total_cost DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      is_completed BOOLEAN NOT NULL DEFAULT false,
      watched_duration_ms INTEGER,
      required_duration_ms INTEGER NOT NULL,
      completion_duration INTEGER,
      required_duration INTEGER NOT NULL DEFAULT 10,
      viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created view_events table');

  // 8. TRANSACTIONS TABLE
  await sequelize.query(`
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
      from_wallet_id UUID REFERENCES wallets(id) ON UPDATE CASCADE ON DELETE SET NULL,
      to_wallet_id UUID REFERENCES wallets(id) ON UPDATE CASCADE ON DELETE SET NULL,
      company_wallet_id UUID,
      type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'view_charge', 'viewer_reward', 'company_fee', 'withdraw', 'deposit', 'refund', 'transfer')),
      amount_micro BIGINT NOT NULL DEFAULT 0,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      reference VARCHAR(255),
      transaction_category VARCHAR(50) NOT NULL DEFAULT 'ad_view' CHECK (transaction_category IN ('package_purchase', 'ad_view', 'viewer_reward', 'company_fee', 'withdrawal', 'deposit', 'refund', 'transfer')),
      status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
      meta JSONB,
      processed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created transactions table');

  // 9. SESSIONS TABLE
  await sequelize.query(`
    CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      token TEXT NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created sessions table');

  // 10. OTP_CODES TABLE
  await sequelize.query(`
    CREATE TABLE otp_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
  `);
  console.log('✅ Created otp_codes table');

  // 11. NOTIFICATIONS TABLE
  await sequelize.query(`
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'withdrawal', 'appeal', 'kyc', 'system', 'alert')),
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status VARCHAR(10) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
      read_at TIMESTAMP WITH TIME ZONE,
      action_url VARCHAR(500),
      expires_at TIMESTAMP WITH TIME ZONE,
      is_email_sent BOOLEAN NOT NULL DEFAULT false,
      is_push_sent BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created notifications table');

  // 12. ADMIN_SETTINGS TABLE
  await sequelize.query(`
    CREATE TABLE admin_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (category IN ('notification', 'system', 'security', 'business')),
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created admin_settings table');

  // 13. COMPANY_WALLETS TABLE
  await sequelize.query(`
    CREATE TABLE company_wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL DEFAULT 'Main Company Wallet',
      company_name VARCHAR(100) NOT NULL,
      balance_micro BIGINT NOT NULL DEFAULT 0,
      balance BIGINT NOT NULL DEFAULT 0,
      held_micro BIGINT NOT NULL DEFAULT 0,
      total_earnings_micro BIGINT NOT NULL DEFAULT 0,
      total_earnings BIGINT NOT NULL DEFAULT 0,
      total_video_views INTEGER NOT NULL DEFAULT 0,
      total_company_fees_micro BIGINT NOT NULL DEFAULT 0,
      total_viewer_rewards_paid_micro BIGINT NOT NULL DEFAULT 0,
      total_ad_spending_micro BIGINT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      wallet_type VARCHAR(20) NOT NULL DEFAULT 'main' CHECK (wallet_type IN ('main', 'reserve', 'operational')),
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created company_wallets table');

  // 14. WITHDRAWALS TABLE
  await sequelize.query(`
    CREATE TABLE withdrawals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      approved BOOLEAN DEFAULT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created withdrawals table');

  // 15. COMMENTS TABLE
  await sequelize.query(`
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL REFERENCES ads(id) ON UPDATE CASCADE ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      content TEXT NOT NULL CHECK (LENGTH(content) BETWEEN 1 AND 1000),
      likes_count INTEGER NOT NULL DEFAULT 0,
      replies_count INTEGER NOT NULL DEFAULT 0,
      parent_id UUID REFERENCES comments(id) ON UPDATE CASCADE ON DELETE CASCADE,
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      deleted_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created comments table');

  // 16. COMMENT_LIKES TABLE
  await sequelize.query(`
    CREATE TABLE comment_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      comment_id UUID NOT NULL REFERENCES comments(id) ON UPDATE CASCADE ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(comment_id, user_id)
    );
  `);
  console.log('✅ Created comment_likes table');

  // 17. AD_APPEALS TABLE
  await sequelize.query(`
    CREATE TABLE ad_appeals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL REFERENCES ads(id) ON UPDATE CASCADE ON DELETE CASCADE,
      advertiser_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      appeal_reason TEXT NOT NULL CHECK (LENGTH(appeal_reason) BETWEEN 10 AND 1000),
      appeal_evidence TEXT CHECK (LENGTH(appeal_evidence) <= 2000),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_response TEXT CHECK (LENGTH(admin_response) <= 1000),
      reviewed_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
      reviewed_at TIMESTAMP WITH TIME ZONE,
      appeal_deadline TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created ad_appeals table');

  // 18. AD_VERIFICATION_HISTORY TABLE
  await sequelize.query(`
    CREATE TABLE ad_verification_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL REFERENCES ads(id) ON UPDATE CASCADE ON DELETE CASCADE,
      action VARCHAR(30) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'appeal_submitted', 'appeal_approved', 'appeal_rejected')),
      admin_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
      notes TEXT CHECK (LENGTH(notes) <= 1000),
      metadata JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Created ad_verification_history table');
}

async function createAllIndexes() {
  console.log('📊 Creating all indexes for performance...');
  
  const indexes = [
    // Users indexes
    { table: 'users', columns: ['phone'], unique: true },
    { table: 'users', columns: ['civil_id'], unique: true },
    { table: 'users', columns: ['role'] },
    { table: 'users', columns: ['kyc_status'] },
    { table: 'users', columns: ['is_active'] },
    
    // Wallets indexes
    { table: 'wallets', columns: ['user_id'], unique: true },
    { table: 'wallets', columns: ['balance_micro'] },
    { table: 'wallets', columns: ['held_micro'] },
    
    // Sections indexes
    { table: 'sections', columns: ['key'], unique: true },
    { table: 'sections', columns: ['is_active'] },
    { table: 'sections', columns: ['sort_order'] },
    
    // Advertiser packages indexes
    { table: 'advertiser_packages', columns: ['is_active'] },
    { table: 'advertiser_packages', columns: ['duration'] },
    
    // Purchased packages indexes
    { table: 'purchased_packages', columns: ['user_id'] },
    { table: 'purchased_packages', columns: ['package_id'] },
    { table: 'purchased_packages', columns: ['status'] },
    { table: 'purchased_packages', columns: ['expires_at'] },
    
    // Ads indexes
    { table: 'ads', columns: ['advertiser_id'] },
    { table: 'ads', columns: ['package_id'] },
    { table: 'ads', columns: ['purchased_package_id'] },
    { table: 'ads', columns: ['section'] },
    { table: 'ads', columns: ['status'] },
    { table: 'ads', columns: ['verification_status'] },
    { table: 'ads', columns: ['is_active'] },
    
    // View events indexes
    { table: 'view_events', columns: ['ad_id'] },
    { table: 'view_events', columns: ['user_id'] },
    { table: 'view_events', columns: ['purchased_package_id'] },
    { table: 'view_events', columns: ['proof_token'], unique: true },
    { table: 'view_events', columns: ['proof_token_expires_at'] },
    { table: 'view_events', columns: ['is_completed'] },
    { table: 'view_events', columns: ['viewed_at'] },
    
    // Transactions indexes
    { table: 'transactions', columns: ['user_id'] },
    { table: 'transactions', columns: ['from_wallet_id'] },
    { table: 'transactions', columns: ['to_wallet_id'] },
    { table: 'transactions', columns: ['type'] },
    { table: 'transactions', columns: ['transaction_category'] },
    { table: 'transactions', columns: ['status'] },
    { table: 'transactions', columns: ['created_at'] },
    
    // Sessions indexes
    { table: 'sessions', columns: ['user_id'] },
    { table: 'sessions', columns: ['token'] },
    { table: 'sessions', columns: ['ip_address'] },
    { table: 'sessions', columns: ['expires_at'] },
    
    // OTP codes indexes
    { table: 'otp_codes', columns: ['phone'] },
    { table: 'otp_codes', columns: ['expires_at'] },
    
    // Notifications indexes
    { table: 'notifications', columns: ['user_id'] },
    { table: 'notifications', columns: ['type'] },
    { table: 'notifications', columns: ['status'] },
    { table: 'notifications', columns: ['priority'] },
    { table: 'notifications', columns: ['created_at'] },
    { table: 'notifications', columns: ['expires_at'] },
    
    // Admin settings indexes
    { table: 'admin_settings', columns: ['key'], unique: true },
    { table: 'admin_settings', columns: ['category'] },
    { table: 'admin_settings', columns: ['is_active'] },
    
    // Company wallets indexes
    { table: 'company_wallets', columns: ['is_active'] },
    { table: 'company_wallets', columns: ['wallet_type'] },
    { table: 'company_wallets', columns: ['balance_micro'] },
    
    // Withdrawals indexes
    { table: 'withdrawals', columns: ['user_id'] },
    { table: 'withdrawals', columns: ['approved'] },
    
    // Comments indexes
    { table: 'comments', columns: ['ad_id'] },
    { table: 'comments', columns: ['user_id'] },
    { table: 'comments', columns: ['parent_id'] },
    { table: 'comments', columns: ['is_deleted'] },
    
    // Comment likes indexes
    { table: 'comment_likes', columns: ['comment_id'] },
    { table: 'comment_likes', columns: ['user_id'] },
    { table: 'comment_likes', columns: ['comment_id', 'user_id'], unique: true },
    
    // Ad appeals indexes
    { table: 'ad_appeals', columns: ['ad_id'] },
    { table: 'ad_appeals', columns: ['advertiser_id'] },
    { table: 'ad_appeals', columns: ['status'] },
    { table: 'ad_appeals', columns: ['appeal_deadline'] },
    
    // Ad verification history indexes
    { table: 'ad_verification_history', columns: ['ad_id'] },
    { table: 'ad_verification_history', columns: ['action'] },
    { table: 'ad_verification_history', columns: ['admin_id'] },
    { table: 'ad_verification_history', columns: ['created_at'] }
  ];
  
  for (const index of indexes) {
    try {
      const indexName = `idx_${index.table}_${index.columns.join('_')}`;
      const uniqueClause = index.unique ? 'UNIQUE' : '';
      await sequelize.query(`
        CREATE ${uniqueClause} INDEX IF NOT EXISTS ${indexName} 
        ON ${index.table} (${index.columns.join(', ')});
      `);
      console.log(`✅ Created index: ${indexName}`);
    } catch (err) {
      console.log(`⚠️  Could not create index for ${index.table}:`, err.message);
    }
  }
}

async function populateDefaultData() {
  console.log('🌱 Populating with essential default data...');
  
  // 1. Create default admin user
  await sequelize.query(`
    INSERT INTO users (id, name, phone, role, kyc_status, is_active, verified_at) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'Admin User', '+96500000000', 'admin', 'verified', true, NOW())
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✅ Created default admin user');

  // 2. Create admin wallet
  await sequelize.query(`
    INSERT INTO wallets (user_id, balance_micro, held_micro, balance) 
    VALUES ('00000000-0000-0000-0000-000000000000', 0, 0, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  `);
  console.log('✅ Created admin wallet');

  // 3. Create all 12 original sections
  await sequelize.query(`
    INSERT INTO sections (key, title, description, icon, color, sort_order) VALUES
    ('restaurants', 'Restaurants & Food', 'Restaurants, cafes, food delivery, and culinary services', 'restaurant', '#FF6B6B', 1),
    ('retail', 'Retail & Shopping', 'Clothing, electronics, home goods, and retail stores', 'shopping_bag', '#4ECDC4', 2),
    ('automotive', 'Automotive', 'Car dealerships, auto services, and vehicle-related businesses', 'directions_car', '#45B7D1', 3),
    ('healthcare', 'Healthcare & Medical', 'Hospitals, clinics, pharmacies, and medical services', 'local_hospital', '#96CEB4', 4),
    ('education', 'Education & Training', 'Schools, universities, training centers, and educational services', 'school', '#FFEAA7', 5),
    ('real_estate', 'Real Estate', 'Property sales, rentals, and real estate services', 'home', '#DDA0DD', 6),
    ('finance', 'Finance & Banking', 'Banks, insurance, investment, and financial services', 'account_balance', '#FFD93D', 7),
    ('technology', 'Technology & IT', 'Software, hardware, IT services, and tech solutions', 'computer', '#6C5CE7', 8),
    ('beauty', 'Beauty & Wellness', 'Salons, spas, beauty products, and wellness services', 'spa', '#FD79A8', 9),
    ('entertainment', 'Entertainment & Leisure', 'Cinemas, events, sports, and entertainment venues', 'movie', '#A29BFE', 10),
    ('travel', 'Travel & Tourism', 'Hotels, travel agencies, and tourism services', 'flight', '#74B9FF', 11),
    ('services', 'Professional Services', 'Legal, consulting, marketing, and professional services', 'business', '#55A3FF', 12)
    ON CONFLICT (key) DO NOTHING;
  `);
  console.log('✅ Created all 12 original sections');

  // 4. Create default advertiser packages
  await sequelize.query(`
    INSERT INTO advertiser_packages (name, duration, price_per_view_micro, min_budget_micro, budget_increment_micro, description) VALUES
    ('Basic Package', 15, 100000, 10000000, 1000000, 'Basic ad package with 15-second duration'),
    ('Standard Package', 30, 200000, 20000000, 2000000, 'Standard ad package with 30-second duration'),
    ('Premium Package', 60, 300000, 30000000, 3000000, 'Premium ad package with 60-second duration')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✅ Created default advertiser packages');

  // 5. Create main company wallet
  await sequelize.query(`
    INSERT INTO company_wallets (name, company_name, balance_micro, balance, wallet_type, is_active) 
    VALUES ('Main Company Wallet', 'ViewApp Company', 0, 0, 'main', true)
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✅ Created main company wallet');

  // 6. Create default admin settings
  const defaultSettings = [
    { key: 'emailNotifications', value: 'true', category: 'notification', description: 'Enable email notifications for admins' },
    { key: 'pushNotifications', value: 'true', category: 'notification', description: 'Enable push notifications for admins' },
    { key: 'verificationAlerts', value: 'true', category: 'notification', description: 'Alert admins about pending verifications' },
    { key: 'withdrawalAlerts', value: 'true', category: 'notification', description: 'Alert admins about withdrawal requests' },
    { key: 'appealAlerts', value: 'true', category: 'notification', description: 'Alert admins about pending appeals' },
    { key: 'autoApproveThreshold', value: '100', category: 'system', description: 'Minimum threshold for auto-approval features' },
    { key: 'maxVideoDuration', value: '30', category: 'system', description: 'Maximum allowed video duration in seconds' },
    { key: 'maxFileSize', value: '50', category: 'system', description: 'Maximum allowed file size in MB' },
    { key: 'maintenanceMode', value: 'false', category: 'system', description: 'Enable maintenance mode for the platform' },
    { key: 'requireTwoFactor', value: 'false', category: 'security', description: 'Require two-factor authentication for admins' },
    { key: 'sessionTimeout', value: '30', category: 'security', description: 'Admin session timeout in minutes' },
    { key: 'maxLoginAttempts', value: '5', category: 'security', description: 'Maximum login attempts before lockout' },
    { key: 'passwordExpiry', value: '90', category: 'security', description: 'Password expiry in days' },
    { key: 'companyFeePercentage', value: '50', category: 'business', description: 'Company fee percentage from ad views' },
    { key: 'minimumWithdrawal', value: '10', category: 'business', description: 'Minimum withdrawal amount in KWD' },
    { key: 'maximumWithdrawal', value: '10000', category: 'business', description: 'Maximum withdrawal amount in KWD' },
    { key: 'autoPayoutEnabled', value: 'false', category: 'business', description: 'Enable automatic payouts for approved withdrawals' }
  ];

  for (const setting of defaultSettings) {
    await sequelize.query(`
      INSERT INTO admin_settings (key, value, category, description, is_active) 
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (key) DO NOTHING;
    `, {
      bind: [setting.key, setting.value, setting.category, setting.description]
    });
  }
  console.log('✅ Created default admin settings');
}

async function verifyDatabaseIntegrity() {
  console.log('🔍 Verifying database integrity...');
  
  try {
    // Check all tables exist
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const expectedTables = [
      'users', 'wallets', 'sections', 'advertiser_packages', 'purchased_packages',
      'ads', 'view_events', 'transactions', 'sessions', 'otp_codes',
      'notifications', 'admin_settings', 'company_wallets', 'withdrawals',
      'comments', 'comment_likes', 'ad_appeals', 'ad_verification_history'
    ];
    
    const existingTables = tables[0].map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    console.log('✅ All required tables exist');
    
    // Check critical data exists
    const adminUser = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role = 'admin';`);
    if (adminUser[0][0].count === '0') {
      throw new Error('No admin user found');
    }
    
    const sections = await sequelize.query(`SELECT COUNT(*) as count FROM sections;`);
    if (sections[0][0].count === '0') {
      throw new Error('No sections found');
    }
    
    const packages = await sequelize.query(`SELECT COUNT(*) as count FROM advertiser_packages;`);
    if (packages[0][0].count === '0') {
      throw new Error('No advertiser packages found');
    }
    
    console.log('✅ Database integrity verified successfully');
    
  } catch (error) {
    console.error('❌ Database integrity check failed:', error);
    throw error;
  }
}

module.exports = {
  completeDatabaseRebuild,
  dropAllTables,
  createAllTables,
  createAllIndexes,
  populateDefaultData,
  verifyDatabaseIntegrity
};
