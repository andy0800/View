// debug-ad-viewing-process.js
// Detailed debug script to trace the ad viewing process

require('dotenv').config();
const { sequelize, User } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

async function debugAdViewingProcess() {
  try {
    console.log('🔍 Debugging Ad Viewing Process Step by Step');
    console.log('=' .repeat(60));
    
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
    
    // Step 1: Login viewer
    console.log('\n🔐 STEP 1: Logging in viewer...');
    const loginResult = await testUtils.loginWithOtp(viewer.phone);
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.error);
      return;
    }
    console.log('✅ Login successful');
    
    // Step 2: Get available ads
    console.log('\n📹 STEP 2: Getting available ads...');
    const adsResult = await testUtils.getAvailableAds(viewer.phone);
    
    if (!adsResult.success) {
      console.log('❌ Failed to get ads:', adsResult.error);
      return;
    }
    
    console.log('✅ Got ads response');
    console.log(`📊 Response status: ${adsResult.data.status}`);
    console.log(`📊 Videos count: ${adsResult.data.data.videos.length}`);
    
    if (adsResult.data.data.videos.length === 0) {
      console.log('❌ No videos available');
      return;
    }
    
    // Step 3: Select a random ad
    const availableAds = adsResult.data.data.videos;
    const randomAd = availableAds[Math.floor(Math.random() * availableAds.length)];
    console.log(`\n🎯 STEP 3: Selected ad: ${randomAd.title} (ID: ${randomAd.id})`);
    console.log(`📊 Ad structure:`, Object.keys(randomAd));
    
    // Step 4: Start watching
    console.log('\n▶️ STEP 4: Starting to watch ad...');
    const startResult = await testUtils.startWatchingAd(viewer.phone, randomAd.id);
    
    if (!startResult.success) {
      console.log('❌ Failed to start watching:', startResult.error);
      return;
    }
    
    console.log('✅ Started watching successfully');
    console.log(`📊 Start response:`, Object.keys(startResult.data.data));
    
    const proofToken = startResult.data.data.proofToken;
    console.log(`🔑 Proof token: ${proofToken}`);
    
    // Step 5: Simulate watching duration
    const watchDuration = randomAd.duration || 15;
    console.log(`\n⏱️ STEP 5: Simulating ${watchDuration} seconds of watching...`);
    await testUtils.sleep(watchDuration * 1000);
    
    // Step 6: Complete watching
    console.log('\n✅ STEP 6: Completing ad watch...');
    const completeResult = await testUtils.completeWatchingAd(viewer.phone, proofToken);
    
    if (!completeResult.success) {
      console.log('❌ Failed to complete watching:', completeResult.error);
      return;
    }
    
    console.log('✅ Completed watching successfully');
    console.log(`📊 Complete response:`, Object.keys(completeResult.data.data));
    
    // Step 7: Check if reward was given
    console.log('\n💰 STEP 7: Checking reward distribution...');
    console.log('✅ Ad viewing process completed successfully!');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await sequelize.close();
  }
}

debugAdViewingProcess();
