// debug-ad-api.js
// Debug script to check the exact API response structure

require('dotenv').config();
const { sequelize, User } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

async function debugAdApi() {
  try {
    console.log('🔍 Debugging Ad API Response Structure');
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
    
    console.log('\n📊 API Response Analysis:');
    console.log('-'.repeat(30));
    
    if (adsResult.success) {
      console.log('✅ API call successful');
      console.log(`📊 Status: ${adsResult.data.status}`);
      console.log(`📊 Response structure:`, Object.keys(adsResult.data));
      
      if (adsResult.data.data) {
        console.log(`📊 Data structure:`, Object.keys(adsResult.data.data));
        
        if (adsResult.data.data.videos) {
          console.log(`📊 Videos array length: ${adsResult.data.data.videos.length}`);
          if (adsResult.data.data.videos.length > 0) {
            console.log(`📊 First video structure:`, Object.keys(adsResult.data.data.videos[0]));
            console.log(`📊 First video ID: ${adsResult.data.data.videos[0].id}`);
          }
        } else if (adsResult.data.data.length > 0) {
          console.log(`📊 Data array length: ${adsResult.data.data.length}`);
          console.log(`📊 First item structure:`, Object.keys(adsResult.data.data[0]));
          console.log(`📊 First item ID: ${adsResult.data.data[0].id}`);
        }
      } else {
        console.log('❌ No data property found');
        console.log('📊 Full response:', JSON.stringify(adsResult.data, null, 2));
      }
    } else {
      console.log('❌ API call failed');
      console.log('📊 Error:', adsResult.error);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await sequelize.close();
  }
}

debugAdApi();
