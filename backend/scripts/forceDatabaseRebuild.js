#!/usr/bin/env node
// backend/scripts/forceDatabaseRebuild.js
'use strict';

/**
 * FORCE DATABASE REBUILD SCRIPT
 * 
 * This script forces a complete database rebuild by:
 * 1. Setting FORCE_DATABASE_REBUILD=true
 * 2. Running the complete rebuild process
 * 3. Verifying the rebuild was successful
 * 
 * Usage:
 *   node scripts/forceDatabaseRebuild.js
 *   FORCE_DATABASE_REBUILD=true node scripts/forceDatabaseRebuild.js
 */

require('dotenv').config();
const { completeDatabaseRebuild } = require('../src/startup/completeDatabaseRebuild');

async function forceRebuild() {
  console.log('🚀 FORCE DATABASE REBUILD SCRIPT STARTING...');
  console.log('⚠️  This will DROP and RECREATE ALL TABLES!');
  console.log('⚠️  ALL DATA WILL BE LOST!');
  
  // Set environment variable to force rebuild
  process.env.FORCE_DATABASE_REBUILD = 'true';
  
  try {
    console.log('🔄 Starting complete database rebuild...');
    const success = await completeDatabaseRebuild();
    
    if (success) {
      console.log('🎉 FORCE DATABASE REBUILD COMPLETED SUCCESSFULLY!');
      console.log('✅ All tables recreated');
      console.log('✅ All indexes created');
      console.log('✅ Default data populated');
      console.log('✅ Database integrity verified');
      process.exit(0);
    } else {
      console.error('❌ FORCE DATABASE REBUILD FAILED!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ FORCE DATABASE REBUILD ERROR:', error);
    process.exit(1);
  }
}

// Run the force rebuild
forceRebuild();
