#!/usr/bin/env node
// backend/scripts/addMissingSections.js
'use strict';

/**
 * ADD MISSING SECTIONS SCRIPT
 * 
 * This script adds the missing 7 sections to the existing database
 * without doing a full rebuild. It only adds sections that don't exist.
 * 
 * Usage:
 *   node scripts/addMissingSections.js
 */

require('dotenv').config();
const { sequelize } = require('../src/models');

async function addMissingSections() {
  console.log('🔧 ADDING MISSING SECTIONS...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Add all 12 original sections (only if they don't exist)
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
    console.log('✅ All 12 sections added (duplicates skipped)');

    // Verify sections were added
    const [sections] = await sequelize.query(`
      SELECT key, title, sort_order FROM sections ORDER BY sort_order;
    `);
    
    console.log('📋 Current sections in database:');
    sections.forEach(section => {
      console.log(`   ${section.sort_order}. ${section.title} (${section.key})`);
    });
    
    console.log(`✅ Total sections: ${sections.length}`);
    
    if (sections.length === 12) {
      console.log('🎉 SUCCESS: All 12 sections are now present!');
    } else {
      console.log(`⚠️  WARNING: Only ${sections.length} sections found, expected 12`);
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR adding sections:', error);
    process.exit(1);
  }
}

// Run the script
addMissingSections();
