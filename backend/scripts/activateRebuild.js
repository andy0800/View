#!/usr/bin/env node
// backend/scripts/activateRebuild.js
'use strict';

/**
 * ACTIVATE DATABASE REBUILD SCRIPT
 * 
 * This script sets the FORCE_DATABASE_REBUILD environment variable
 * and restarts the application to trigger a complete database rebuild.
 * 
 * Usage:
 *   node scripts/activateRebuild.js
 */

console.log('🚀 ACTIVATING DATABASE REBUILD...');

// Set the environment variable
process.env.FORCE_DATABASE_REBUILD = 'true';

console.log('✅ FORCE_DATABASE_REBUILD=true set');
console.log('🔄 Restarting application to trigger rebuild...');

// Import and run the complete rebuild
const { completeDatabaseRebuild } = require('../src/startup/completeDatabaseRebuild');

async function activateRebuild() {
  try {
    console.log('🔧 Running complete database rebuild...');
    await completeDatabaseRebuild();
    console.log('🎉 DATABASE REBUILD ACTIVATED SUCCESSFULLY!');
    console.log('✅ All tables recreated');
    console.log('✅ All relationships established');
    console.log('✅ Default data populated');
    process.exit(0);
  } catch (error) {
    console.error('❌ REBUILD ACTIVATION FAILED:', error);
    process.exit(1);
  }
}

activateRebuild();
