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
    
    // 2. Ensure admin user exists
    await ensureAdminUser();
    
    // 3. Ensure admin settings exist
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

    // Insert all 12 sections (will skip duplicates)
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
    console.log('✅ All 12 sections ensured');

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

module.exports = { initializeDatabase };
