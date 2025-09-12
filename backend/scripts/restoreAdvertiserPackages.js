#!/usr/bin/env node
// backend/scripts/restoreAdvertiserPackages.js
'use strict';

/**
 * COMPLETE ADVERTISER PACKAGES RESTORATION SCRIPT
 * 
 * This script restores ALL missing advertiser packages and related data
 * that were lost during the database rebuild. It creates:
 * 
 * 1. advertiser_packages table with all 4 default packages
 * 2. purchased_packages table structure
 * 3. All related associations and indexes
 * 4. Default package data with micro-unit pricing
 * 
 * This script runs forcefully during deployment and ensures
 * the complete advertiser package system is restored.
 * 
 * Usage:
 *   node scripts/restoreAdvertiserPackages.js
 */

require('dotenv').config();
const { sequelize } = require('../src/models');

async function restoreAdvertiserPackages() {
  console.log('🔧 RESTORING ADVERTISER PACKAGES SYSTEM...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Create advertiser_packages table
    await createAdvertiserPackagesTable();
    
    // 2. Create purchased_packages table
    await createPurchasedPackagesTable();
    
    // 3. Insert default advertiser packages
    await insertDefaultPackages();
    
    // 4. Verify restoration
    await verifyRestoration();
    
    console.log('✅ Advertiser packages system restored successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR restoring advertiser packages:', error);
    process.exit(1);
  }
}

async function createAdvertiserPackagesTable() {
  console.log('🔧 Creating advertiser_packages table...');
  
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
  
  // Create indexes
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_advertiser_packages_is_active ON advertiser_packages(is_active);
  `);
  
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_advertiser_packages_duration ON advertiser_packages(duration);
  `);
  
  console.log('✅ advertiser_packages table created');
}

async function createPurchasedPackagesTable() {
  console.log('🔧 Creating purchased_packages table...');
  
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS purchased_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      package_id INTEGER NOT NULL REFERENCES advertiser_packages(id) ON DELETE RESTRICT,
      total_budget_micro BIGINT NOT NULL,
      remaining_budget_micro BIGINT NOT NULL,
      estimated_views INTEGER NOT NULL,
      views_completed INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
      purchased_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Create indexes
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_purchased_packages_user_id ON purchased_packages(user_id);
  `);
  
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_purchased_packages_package_id ON purchased_packages(package_id);
  `);
  
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_purchased_packages_status ON purchased_packages(status);
  `);
  
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_purchased_packages_expires_at ON purchased_packages(expires_at);
  `);
  
  console.log('✅ purchased_packages table created');
}

async function insertDefaultPackages() {
  console.log('🔧 Inserting default advertiser packages...');
  
  // Clear existing packages first
  await sequelize.query('DELETE FROM advertiser_packages;');
  console.log('✅ Existing packages cleared');
  
  // Insert all 4 default packages with micro-unit pricing
  await sequelize.query(`
    INSERT INTO advertiser_packages (name, duration, price_per_view_micro, min_budget_micro, budget_increment_micro, description, is_active) VALUES
    ('Basic Package', 10, 10000, 300000000, 100000000, '10-second video ads with maximum engagement', true),
    ('Standard Package', 15, 14000, 300000000, 100000000, '15-second video ads for detailed messaging', true),
    ('Premium Package', 20, 16000, 300000000, 100000000, '20-second video ads with comprehensive content', true),
    ('Extended Package', 30, 24000, 300000000, 100000000, '30-second video ads for full storytelling', true);
  `);
  
  console.log('✅ Default packages inserted');
}

async function verifyRestoration() {
  console.log('🔍 Verifying restoration...');
  
  // Check advertiser_packages
  const [packages] = await sequelize.query(`
    SELECT id, name, duration, price_per_view_micro, min_budget_micro, budget_increment_micro, is_active 
    FROM advertiser_packages 
    ORDER BY duration;
  `);
  
  console.log('📦 Advertiser packages:');
  packages.forEach(pkg => {
    const priceKWD = (pkg.price_per_view_micro / 1000000).toFixed(3);
    const minBudgetKWD = (pkg.min_budget_micro / 1000000).toFixed(0);
    const incrementKWD = (pkg.budget_increment_micro / 1000000).toFixed(0);
    console.log(`   ${pkg.id}. ${pkg.name} (${pkg.duration}s) - ${priceKWD} KWD/view, Min: ${minBudgetKWD} KWD, Inc: ${incrementKWD} KWD`);
  });
  
  // Check purchased_packages table structure
  const [purchasedTable] = await sequelize.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'purchased_packages' 
    ORDER BY ordinal_position;
  `);
  
  console.log('📋 purchased_packages table structure:');
  purchasedTable.forEach(col => {
    console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
  });
  
  // Check foreign key constraints
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
  
  console.log('🔗 Foreign key constraints:');
  foreignKeys.forEach(fk => {
    console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  });
  
  console.log(`✅ Verification complete: ${packages.length} packages, ${purchasedTable.length} columns in purchased_packages`);
}

// Run the script
restoreAdvertiserPackages();
