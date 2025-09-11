#!/usr/bin/env node
// backend/src/startup/databaseInit.js
'use strict';

/**
 * SIMPLE DATABASE INITIALIZATION
 * 
 * This script ensures all required data is present in the database.
 * It runs on every application startup and is designed to be reliable.
 * 
 * Features:
 * - Creates missing tables if needed
 * - Ensures all 12 sections are present
 * - Creates admin user if missing
 * - Sets up admin settings
 * - Simple and focused - no complex rebuild logic
 */

const { sequelize } = require('../models');

async function initializeDatabase() {
  console.log('🚀 INITIALIZING DATABASE...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Ensure sections table exists and has all 12 sections
    await ensureAllSections();
    
    // 2. Restore advertiser packages system
    await restoreAdvertiserPackages();
    
    // 3. Ensure admin user exists
    await ensureAdminUser();
    
    // 4. Ensure admin settings exist
    await ensureAdminSettings();
    
    console.log('✅ Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

async function ensureAllSections() {
  console.log('🔧 Ensuring all 12 sections are present...');
  
  try {
    // First, ensure sections table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(20),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        ad_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Sections table ensured');

    // Delete all existing sections to prevent duplicates
    await sequelize.query('DELETE FROM sections;');
    console.log('✅ Existing sections cleared');

    // Insert all 12 sections (fresh insert)
    await sequelize.query(`
      INSERT INTO sections (key, title, description, icon, color, sort_order, is_active, ad_count, created_at, updated_at) VALUES
      ('restaurants', 'Restaurants & Food', 'Restaurants, cafes, food delivery, and culinary services', 'restaurant', '#FF6B6B', 1, true, 0, NOW(), NOW()),
      ('retail', 'Retail & Shopping', 'Clothing, electronics, home goods, and retail stores', 'shopping_bag', '#4ECDC4', 2, true, 0, NOW(), NOW()),
      ('automotive', 'Automotive', 'Car dealerships, auto services, and vehicle-related businesses', 'directions_car', '#45B7D1', 3, true, 0, NOW(), NOW()),
      ('healthcare', 'Healthcare & Medical', 'Hospitals, clinics, pharmacies, and medical services', 'local_hospital', '#96CEB4', 4, true, 0, NOW(), NOW()),
      ('education', 'Education & Training', 'Schools, universities, training centers, and educational services', 'school', '#FFEAA7', 5, true, 0, NOW(), NOW()),
      ('real_estate', 'Real Estate', 'Property sales, rentals, and real estate services', 'home', '#DDA0DD', 6, true, 0, NOW(), NOW()),
      ('finance', 'Finance & Banking', 'Banks, insurance, investment, and financial services', 'account_balance', '#FFD93D', 7, true, 0, NOW(), NOW()),
      ('technology', 'Technology & IT', 'Software, hardware, IT services, and tech solutions', 'computer', '#6C5CE7', 8, true, 0, NOW(), NOW()),
      ('beauty', 'Beauty & Wellness', 'Salons, spas, beauty products, and wellness services', 'spa', '#FD79A8', 9, true, 0, NOW(), NOW()),
      ('entertainment', 'Entertainment & Leisure', 'Cinemas, events, sports, and entertainment venues', 'movie', '#A29BFE', 10, true, 0, NOW(), NOW()),
      ('travel', 'Travel & Tourism', 'Hotels, travel agencies, and tourism services', 'flight', '#74B9FF', 11, true, 0, NOW(), NOW()),
      ('services', 'Professional Services', 'Legal, consulting, marketing, and professional services', 'business', '#55A3FF', 12, true, 0, NOW(), NOW());
    `);
    console.log('✅ All 12 sections inserted');

    // Verify sections count
    const [result] = await sequelize.query('SELECT COUNT(*) as count FROM sections;');
    console.log(`📊 Total sections in database: ${result[0].count}`);

  } catch (error) {
    console.error('❌ Error ensuring sections:', error.message);
    throw error;
  }
}

async function ensureAdminUser() {
  console.log('🔧 Ensuring admin user exists...');
  
  try {
    // Check if admin user exists
    const [adminCheck] = await sequelize.query(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1;
    `);
    
    if (adminCheck.length === 0) {
      console.log('🔧 Creating admin user...');
      await sequelize.query(`
        INSERT INTO users (id, name, phone, role, kyc_status, is_active, verified_at, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Admin', '+0000000000', 'admin', 'verified', true, NOW(), NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error.message);
    throw error;
  }
}

async function ensureAdminSettings() {
  console.log('🔧 Ensuring admin settings exist...');
  
  try {
    // Check if admin settings exist
    const [settingsCheck] = await sequelize.query(`
      SELECT id FROM admin_settings LIMIT 1;
    `);
    
    if (settingsCheck.length === 0) {
      console.log('🔧 Creating admin settings...');
      await sequelize.query(`
        INSERT INTO admin_settings (id, key, value, description, created_at, updated_at)
        VALUES 
        ('00000000-0000-0000-0000-000000000001', 'platform_name', 'View App', 'Platform name', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000002', 'platform_description', 'Watch ads and earn rewards', 'Platform description', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000003', 'min_withdrawal', '1000', 'Minimum withdrawal amount in fils', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000004', 'max_withdrawal', '1000000', 'Maximum withdrawal amount in fils', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Admin settings created');
    } else {
      console.log('✅ Admin settings already exist');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin settings:', error.message);
    throw error;
  }
}

async function restoreAdvertiserPackages() {
  console.log('🔧 Restoring advertiser packages system...');
  
  try {
    // 1. Create advertiser_packages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS advertiser_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        price_per_view_micro BIGINT NOT NULL,
        min_budget_micro BIGINT NOT NULL DEFAULT 300000000,
        budget_increment_micro BIGINT NOT NULL DEFAULT 100000000,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ advertiser_packages table created');
    
    // 2. Create purchased_packages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchased_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        package_id INTEGER NOT NULL REFERENCES advertiser_packages(id) ON DELETE RESTRICT,
        total_budget_micro BIGINT NOT NULL,
        remaining_budget_micro BIGINT NOT NULL,
        estimated_views INTEGER NOT NULL,
        actual_views INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ purchased_packages table created');
    
    // 3. Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_advertiser_packages_is_active ON advertiser_packages(is_active);
      CREATE INDEX IF NOT EXISTS idx_advertiser_packages_duration ON advertiser_packages(duration);
      CREATE INDEX IF NOT EXISTS idx_purchased_packages_user_id ON purchased_packages(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchased_packages_package_id ON purchased_packages(package_id);
      CREATE INDEX IF NOT EXISTS idx_purchased_packages_status ON purchased_packages(status);
      CREATE INDEX IF NOT EXISTS idx_purchased_packages_expires_at ON purchased_packages(expires_at);
    `);
    console.log('✅ Indexes created');
    
    // 4. Clear existing packages and insert defaults
    await sequelize.query('DELETE FROM advertiser_packages;');
    console.log('✅ Existing packages cleared');
    
    await sequelize.query(`
      INSERT INTO advertiser_packages (name, duration, price_per_view_micro, min_budget_micro, budget_increment_micro, description, is_active) VALUES
      ('Basic Package', 10, 10000, 300000000, 100000000, '10-second video ads with maximum engagement', true),
      ('Standard Package', 15, 14000, 300000000, 100000000, '15-second video ads for detailed messaging', true),
      ('Premium Package', 20, 16000, 300000000, 100000000, '20-second video ads with comprehensive content', true),
      ('Extended Package', 30, 24000, 300000000, 100000000, '30-second video ads for full storytelling', true);
    `);
    console.log('✅ Default packages inserted');
    
    // 5. Verify restoration
    const [packages] = await sequelize.query(`
      SELECT id, name, duration, price_per_view_micro, is_active 
      FROM advertiser_packages 
      ORDER BY duration;
    `);
    
    console.log(`📦 Advertiser packages restored: ${packages.length} packages`);
    packages.forEach(pkg => {
      const priceKWD = (pkg.price_per_view_micro / 1000000).toFixed(3);
      console.log(`   ${pkg.id}. ${pkg.name} (${pkg.duration}s) - ${priceKWD} KWD/view`);
    });
    
    console.log('✅ Advertiser packages system restored');
  } catch (error) {
    console.error('❌ Error restoring advertiser packages:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };
