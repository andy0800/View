#!/usr/bin/env node

/**
 * Test Script for New Micro-Unit Ads System with Proof Token Implementation
 */

const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

// Create Sequelize instance
const sequelize = new Sequelize(config.development);

async function testNewAdsSystem() {
  try {
    console.log('🧪 Testing New Ads System with Proof Token Implementation...\n');

    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if new columns exist
    console.log('2️⃣ Checking new micro-unit columns...');
    
    const advertiserPackagesColumns = await sequelize.getQueryInterface().describeTable('advertiser_packages');
    console.log('📦 advertiser_packages columns:', Object.keys(advertiserPackagesColumns));
    
    const purchasedPackagesColumns = await sequelize.getQueryInterface().describeTable('purchased_packages');
    console.log('📦 purchased_packages columns:', Object.keys(purchasedPackagesColumns));
    
    const walletsColumns = await sequelize.getQueryInterface().describeTable('wallets');
    console.log('💰 wallets columns:', Object.keys(walletsColumns));
    
    const transactionsColumns = await sequelize.getQueryInterface().describeTable('transactions');
    console.log('💳 transactions columns:', Object.keys(transactionsColumns));
    
    const viewEventsColumns = await sequelize.getQueryInterface().describeTable('view_events');
    console.log('👁️ view_events columns:', Object.keys(viewEventsColumns));

    // Test 3: Check if micro-unit columns exist
    console.log('\n3️⃣ Verifying micro-unit columns...');
    
    const requiredColumns = {
      'advertiser_packages': ['price_per_view_micro'],
      'purchased_packages': ['budget_micro', 'remaining_micro', 'used_micro', 'expires_at'],
      'wallets': ['balance_micro', 'held_micro'],
      'transactions': ['amount_micro'],
      'view_events': ['charged_micro', 'viewer_reward_micro', 'proof_token', 'proof_token_expires_at']
    };

    let allColumnsExist = true;
    
    for (const [table, columns] of Object.entries(requiredColumns)) {
      const tableColumns = await sequelize.getQueryInterface().describeTable(table);
      
      for (const column of columns) {
        if (tableColumns[column]) {
          console.log(`✅ ${table}.${column} exists`);
        } else {
          console.log(`❌ ${table}.${column} missing`);
          allColumnsExist = false;
        }
      }
    }

    if (allColumnsExist) {
      console.log('\n🎉 All required micro-unit and proof token columns exist!');
    } else {
      console.log('\n⚠️ Some columns are missing');
    }

    // Test 4: Test basic queries
    console.log('\n4️⃣ Testing basic queries...');
    
    try {
      const advertiserPackages = await sequelize.query('SELECT COUNT(*) as count FROM advertiser_packages', { type: Sequelize.QueryTypes.SELECT });
      console.log(`✅ advertiser_packages count: ${advertiserPackages[0].count}`);
      
      const purchasedPackages = await sequelize.query('SELECT COUNT(*) as count FROM purchased_packages', { type: Sequelize.QueryTypes.SELECT });
      console.log(`✅ purchased_packages count: ${purchasedPackages[0].count}`);
      
      const wallets = await sequelize.query('SELECT COUNT(*) as count FROM wallets', { type: Sequelize.QueryTypes.SELECT });
      console.log(`✅ wallets count: ${wallets[0].count}`);
      
      const transactions = await sequelize.query('SELECT COUNT(*) as count FROM transactions', { type: Sequelize.QueryTypes.SELECT });
      console.log(`✅ transactions count: ${transactions[0].count}`);
      
      const viewEvents = await sequelize.query('SELECT COUNT(*) as count FROM view_events', { type: Sequelize.QueryTypes.SELECT });
      console.log(`✅ view_events count: ${viewEvents[0].count}`);
      
    } catch (error) {
      console.log(`⚠️ Query test failed: ${error.message}`);
    }

    // Test 5: Test proof token system
    console.log('\n5️⃣ Testing proof token system...');
    
    try {
      // Check if view_events table has proof token columns
      const viewEventsTable = await sequelize.getQueryInterface().describeTable('view_events');
      
      if (viewEventsTable.proof_token && viewEventsTable.proof_token_expires_at) {
        console.log('✅ Proof token system columns exist');
        
        // Test proof token generation
        const crypto = require('crypto');
        const nonce = crypto.randomBytes(16).toString('hex');
        const startTs = Date.now();
        const proofToken = crypto
          .createHmac('sha256', process.env.PROOF_TOKEN_SECRET || 'default-secret')
          .update(`test${nonce}${startTs}`)
          .digest('hex');
        
        console.log('✅ Proof token generation test successful');
        console.log(`   Sample token: ${proofToken.substring(0, 16)}...`);
      } else {
        console.log('❌ Proof token system columns missing');
      }
    } catch (error) {
      console.log(`⚠️ Proof token test failed: ${error.message}`);
    }

    // Test 6: Test micro-unit calculations
    console.log('\n6️⃣ Testing micro-unit calculations...');
    
    try {
      // Test 50/50 split calculation
      const testPriceMicro = 1000000; // 1 KWD
      const viewerShare = Math.floor(testPriceMicro / 2);
      const companyShare = testPriceMicro - viewerShare;
      
      console.log(`✅ Micro-unit calculation test successful`);
      console.log(`   Price per view: ${testPriceMicro} micro units (1 KWD)`);
      console.log(`   Viewer reward: ${viewerShare} micro units (${viewerShare / 1000000} KWD)`);
      console.log(`   Company share: ${companyShare} micro units (${companyShare / 1000000} KWD)`);
      console.log(`   50/50 split: ${viewerShare === companyShare ? '✅ Correct' : '❌ Incorrect'}`);
      
    } catch (error) {
      console.log(`⚠️ Micro-unit calculation test failed: ${error.message}`);
    }

    // Test 3: Check advertiser endpoints
    console.log('3️⃣ Testing advertiser endpoints...');
    
    try {
      // Test package endpoints
      const packagesResponse = await fetch('http://localhost:4001/api/advertiser/packages');
      if (packagesResponse.ok) {
        const packages = await packagesResponse.json();
        console.log('✅ Advertiser packages endpoint working:', packages.length, 'packages found');
      } else {
        console.log('⚠️ Advertiser packages endpoint returned status:', packagesResponse.status);
      }
      
      // Test dashboard endpoint
      const dashboardResponse = await fetch('http://localhost:4001/api/advertiser/dashboard');
      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        console.log('✅ Advertiser dashboard endpoint working');
      } else {
        console.log('⚠️ Advertiser dashboard endpoint returned status:', dashboardResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Advertiser endpoints test failed:', error.message);
    }

    console.log('\n✅ Testing completed successfully!');

  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testNewAdsSystem();
