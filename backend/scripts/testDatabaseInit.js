#!/usr/bin/env node
// backend/scripts/testDatabaseInit.js
'use strict';

/**
 * TEST DATABASE INITIALIZATION
 * 
 * This script tests the database initialization locally
 * to ensure it works before deployment.
 */

require('dotenv').config();
const { initializeDatabase } = require('../src/startup/databaseInit');

async function testDatabaseInit() {
  console.log('🧪 TESTING DATABASE INITIALIZATION...');
  
  try {
    const success = await initializeDatabase();
    
    if (success) {
      console.log('✅ Database initialization test PASSED');
      process.exit(0);
    } else {
      console.log('❌ Database initialization test FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database initialization test ERROR:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseInit();
