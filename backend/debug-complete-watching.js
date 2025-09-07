// debug-complete-watching.js
// Debug script to check the complete watching API

require('dotenv').config();
const { sequelize, User } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

async function debugCompleteWatching() {
  try {
    console.log('🔍 Debugging Complete Watching API');
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
    
    const selectedAd = adsResult.data.data.videos[0];
    console.log(`🎯 Using ad: ${selectedAd.title} (ID: ${selectedAd.id})`);
    
    // Start watching
    console.log('\n▶️ Starting to watch ad...');
    const startResult = await testUtils.startWatchingAd(viewer.phone, selectedAd.id);
    
    if (!startResult.success) {
      console.log('❌ Failed to start watching:', startResult.error);
      return;
    }
    
    console.log('✅ Started watching successfully');
    
    // Extract proof token
    const proofToken = startResult.data.data.viewEvent.proofToken;
    console.log(`🔑 Proof token: ${proofToken}`);
    
    // Check the complete watching endpoint configuration
    console.log('\n🔍 CHECKING COMPLETE WATCHING ENDPOINT:');
    console.log('-'.repeat(40));
    
    const { API_ENDPOINTS } = require('./pressure-test/test-config');
    console.log(`📊 Complete watching endpoint: ${API_ENDPOINTS.viewer.completeWatching}`);
    
    // Check if the endpoint has placeholders
    if (API_ENDPOINTS.viewer.completeWatching.includes(':adId')) {
      console.log('⚠️ Endpoint has :adId placeholder that needs replacement');
    }
    
    // Simulate watching duration
    const watchDuration = selectedAd.duration || 15;
    console.log(`\n⏱️ Simulating ${watchDuration} seconds of watching...`);
    await testUtils.sleep(watchDuration * 1000);
    
    // Try to complete watching with detailed error logging
    console.log('\n✅ Attempting to complete ad watch...');
    console.log(`📊 Using proof token: ${proofToken}`);
    
    try {
      const completeResult = await testUtils.completeWatchingAd(viewer.phone, proofToken);
      console.log('✅ Completed watching successfully');
      console.log('📊 Response:', completeResult);
    } catch (error) {
      console.log('❌ Failed to complete watching');
      console.log('📊 Error details:', error.message);
      
      if (error.response) {
        console.log('📊 Response status:', error.response.status);
        console.log('📊 Response data:', error.response.data);
        console.log('📊 Response headers:', error.response.headers);
      }
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await sequelize.close();
  }
}

debugCompleteWatching();
