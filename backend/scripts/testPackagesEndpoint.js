#!/usr/bin/env node
// backend/scripts/testPackagesEndpoint.js
'use strict';

/**
 * Test script to verify advertiser packages endpoint
 * This will help us confirm if the packages are being served correctly
 */

const axios = require('axios');

async function testPackagesEndpoint() {
  const baseURL = process.env.API_BASE_URL || 'https://viewonline.me/api';
  
  console.log('🧪 Testing advertiser packages endpoint...');
  console.log(`📍 Testing: ${baseURL}/test/packages`);
  
  try {
    // Test the public test endpoint first
    const testResponse = await axios.get(`${baseURL}/test/packages`);
    
    console.log('✅ Test endpoint response:');
    console.log(`   Status: ${testResponse.status}`);
    console.log(`   Success: ${testResponse.data.success}`);
    console.log(`   Package count: ${testResponse.data.count}`);
    
    if (testResponse.data.packages && testResponse.data.packages.length > 0) {
      console.log('📦 Packages found:');
      testResponse.data.packages.forEach(pkg => {
        console.log(`   ${pkg.id}. ${pkg.name} (${pkg.duration}s) - ${pkg.pricePerViewKWD} KWD/view`);
      });
    } else {
      console.log('❌ No packages found in test endpoint');
    }
    
  } catch (error) {
    console.error('❌ Test endpoint failed:');
    console.error(`   Status: ${error.response?.status || 'No response'}`);
    console.error(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  console.log('\n🔍 Testing health endpoint...');
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Run the test
testPackagesEndpoint()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
