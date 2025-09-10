#!/usr/bin/env node
// backend/scripts/rebuildSectionsOnly.js
'use strict';

/**
 * REBUILD SECTIONS ONLY
 * 
 * This script forcefully rebuilds ONLY the sections table.
 * It deletes all existing sections and recreates them with the correct data.
 * 
 * Usage:
 *   node scripts/rebuildSectionsOnly.js
 */

require('dotenv').config();
const { sequelize } = require('../src/models');

async function rebuildSectionsOnly() {
  console.log('🔧 REBUILDING SECTIONS TABLE ONLY...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Delete all existing sections
    console.log('🗑️ Deleting all existing sections...');
    await sequelize.query('DELETE FROM sections;');
    console.log('✅ All sections deleted');

    // 2. Reset the sequence (if using auto-increment)
    console.log('🔄 Resetting sections sequence...');
    await sequelize.query('ALTER SEQUENCE sections_id_seq RESTART WITH 1;');
    console.log('✅ Sequence reset');

    // 3. Insert all 12 sections with correct data
    console.log('➕ Inserting all 12 sections...');
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

    // 4. Verify the sections
    console.log('🔍 Verifying sections...');
    const [sections] = await sequelize.query(`
      SELECT key, title, sort_order FROM sections ORDER BY sort_order;
    `);
    
    console.log('📋 Current sections in database:');
    sections.forEach(section => {
      console.log(`   ${section.sort_order}. ${section.title} (${section.key})`);
    });
    
    console.log(`✅ Total sections: ${sections.length}`);
    
    if (sections.length === 12) {
      console.log('🎉 SUCCESS: All 12 sections rebuilt successfully!');
    } else {
      console.log(`⚠️  WARNING: Only ${sections.length} sections found, expected 12`);
    }

    // 5. Check for duplicates
    const [duplicates] = await sequelize.query(`
      SELECT key, COUNT(*) as count 
      FROM sections 
      GROUP BY key 
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICATES FOUND:');
      duplicates.forEach(dup => {
        console.log(`   ${dup.key}: ${dup.count} entries`);
      });
    } else {
      console.log('✅ No duplicates found');
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR rebuilding sections:', error);
    process.exit(1);
  }
}

// Run the script
rebuildSectionsOnly();
