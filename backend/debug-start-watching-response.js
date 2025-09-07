// debug-start-watching-response.js
// Debug script to check the exact start watching API response

require('dotenv').config();
const { sequelize, User } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

async function debugStartWatchingResponse() {
  try {
    console.log('🔍 Debugging Start Watching API Response');
    console.log('=' .repeat(50));
    
    const testUtils = new TestUtils();
    
    // Get a test viewer
    const viewer = await User.findOne({
      where: { role: 'viewer' }
    });
    
    if (!viewer) {
      console.log('❌ No viewers found');
      return;
    }
    
    console.log(`👤 Using viewer: ${viewer.phone} (${viewer.name})`);
    
    // Login viewer
    console.log('\n🔐 Logging in viewer...');
    await testUtils.loginWithOtp(viewer.phone);
    
    // Get available ads
    console.log('\n📹 Getting available ads...');
    const adsResult = await testUtils.getAvailableAds(viewer.phone);
    
    if (!adsResult.success || !adsResult.data.data.videos.length) {
      console.log('❌ No ads available');
      return;
    }
    
    const randomAd = adsResult.data.data.videos[0];
    console.log(`🎯 Using ad: ${randomAd.title} (ID: ${randomAd.id})`);
    
    // Start watching and examine response
    console.log('\n▶️ Starting to watch ad...');
    const startResult = await testUtils.startWatchingAd(viewer.phone, randomAd.id);
    
    console.log('\n📊 START WATCHING RESPONSE ANALYSIS:');
    console.log('-'.repeat(40));
    
    if (startResult.success) {
      console.log('✅ API call successful');
      console.log(`📊 Response status: ${startResult.data.status}`);
      console.log(`📊 Full response structure:`, Object.keys(startResult.data));
      
      if (startResult.data.data) {
        console.log(`📊 Data structure:`, Object.keys(startResult.data.data));
        
        // Check each field in detail
        Object.keys(startResult.data.data).forEach(key => {
          const value = startResult.data.data[key];
          console.log(`📊 ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
        });
        
        // Look for proof token in different possible locations
        console.log('\n🔍 SEARCHING FOR PROOF TOKEN:');
        console.log('-'.repeat(30));
        
        if (startResult.data.data.proofToken) {
          console.log('✅ Found proofToken in data.data.proofToken');
        } else if (startResult.data.data.viewEvent && startResult.data.data.viewEvent.proofToken) {
          console.log('✅ Found proofToken in data.data.viewEvent.proofToken');
        } else if (startResult.data.data.token) {
          console.log('✅ Found token in data.data.token');
        } else if (startResult.data.proofToken) {
          console.log('✅ Found proofToken in data.proofToken');
        } else {
          console.log('❌ No proofToken found in any expected location');
          console.log('🔍 Full response data:', JSON.stringify(startResult.data, null, 2));
        }
      } else {
        console.log('❌ No data property in response');
        console.log('🔍 Full response:', JSON.stringify(startResult.data, null, 2));
      }
    } else {
      console.log('❌ API call failed');
      console.log('📊 Error:', startResult.error);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await sequelize.close();
  }
}

debugStartWatchingResponse();
