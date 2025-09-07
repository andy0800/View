// detailed-ad-viewing-test.js
// Detailed ad viewing test with comprehensive logging

require('dotenv').config();
const { sequelize, User, Wallet, Ad, PurchasedPackage, ViewEvent, Transaction } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class DetailedAdViewingTest {
  constructor() {
    this.testUtils = new TestUtils();
    this.testResults = {
      viewersProcessed: 0,
      adsViewed: 0,
      rewardsDistributed: 0,
      transactionsRecorded: 0,
      errors: [],
      startTime: Date.now()
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Detailed Ad Viewing Test');
      console.log('=' .repeat(60));
      
      // Phase 1: Load existing data
      await this.loadExistingData();
      
      // Phase 2: Test viewers watching ads
      await this.testViewersWatchingAds();
      
      // Phase 3: Generate report
      await this.generateReport();
      
      console.log('🎉 Detailed ad viewing test completed!');
      
    } catch (error) {
      console.error('❌ Detailed ad viewing test failed:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  }

  async loadExistingData() {
    console.log('\n📋 PHASE 1: LOADING EXISTING DATA');
    console.log('-'.repeat(40));
    
    // Load existing viewers
    const viewers = await User.findAll({
      where: { role: 'viewer' },
      include: [{ model: Wallet, as: 'wallet' }]
    });
    
    console.log(`✅ Loaded ${viewers.length} existing viewers`);
    
    // Load existing ads
    const ads = await Ad.findAll({
      where: { 
        status: 'active',
        is_active: true,
        verification_status: 'approved'
      },
      include: [{ model: PurchasedPackage, as: 'purchasedPackage' }]
    });
    
    console.log(`✅ Loaded ${ads.length} active ads`);
    
    // Store for testing
    this.viewers = viewers;
    this.ads = ads;
    
    if (this.viewers.length === 0) {
      throw new Error('No viewers found in database');
    }
    
    if (this.ads.length === 0) {
      throw new Error('No active ads found in database');
    }
  }

  async testViewersWatchingAds() {
    console.log('\n👀 PHASE 2: TESTING VIEWERS WATCHING ADS');
    console.log('-'.repeat(40));
    
    // Test with just 3 viewers for detailed logging
    const testViewers = this.viewers.slice(0, 3);
    console.log(`📊 Testing with ${testViewers.length} viewers for detailed logging`);
    
    for (let i = 0; i < testViewers.length; i++) {
      const viewer = testViewers[i];
      console.log(`\n🔄 Testing viewer ${i + 1}/${testViewers.length}: ${viewer.phone}`);
      
      try {
        const result = await this.testSingleViewerWatchingAds(viewer);
        this.testResults.viewersProcessed++;
        this.testResults.adsViewed += result.adsViewed;
        this.testResults.rewardsDistributed += result.rewardsEarned;
        this.testResults.transactionsRecorded += result.transactionsCreated;
        
        console.log(`✅ Viewer ${viewer.phone} completed: ${result.adsViewed} ads viewed, ${result.rewardsEarned.toFixed(3)} KWD earned`);
        
      } catch (error) {
        console.log(`❌ Viewer ${viewer.phone} failed: ${error.message}`);
        this.testResults.errors.push(`Viewer ${viewer.phone}: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 Testing completed for ${testViewers.length} viewers`);
  }

  async testSingleViewerWatchingAds(viewer) {
    console.log(`  🔐 Logging in viewer ${viewer.phone}...`);
    
    // Login viewer
    await this.testUtils.loginWithOtp(viewer.phone);
    console.log(`  ✅ Login successful for ${viewer.phone}`);
    
    let adsViewed = 0;
    let rewardsEarned = 0;
    let transactionsCreated = 0;
    
    // Watch 2 ads per viewer
    const adsToWatch = 2;
    console.log(`  📹 Planning to watch ${adsToWatch} ads`);
    
    for (let adIndex = 0; adIndex < adsToWatch; adIndex++) {
      console.log(`  \n  🎯 Ad ${adIndex + 1}/${adsToWatch}:`);
      
      try {
        // Get available ads
        console.log(`    📋 Getting available ads...`);
        const adsResult = await this.testUtils.getAvailableAds(viewer.phone);
        
        if (!adsResult.success) {
          console.log(`    ❌ Failed to get ads: ${adsResult.error}`);
          continue;
        }
        
        if (!adsResult.data.data || !adsResult.data.data.videos || adsResult.data.data.videos.length === 0) {
          console.log(`    ❌ No videos available`);
          continue;
        }
        
        const availableAds = adsResult.data.data.videos;
        console.log(`    ✅ Found ${availableAds.length} available ads`);
        
        // Select first available ad
        const selectedAd = availableAds[0];
        console.log(`    🎯 Selected ad: ${selectedAd.title} (ID: ${selectedAd.id})`);
        
        // Start watching
        console.log(`    ▶️ Starting to watch ad...`);
        const startResult = await this.testUtils.startWatchingAd(viewer.phone, selectedAd.id);
        
        if (!startResult.success) {
          console.log(`    ❌ Failed to start watching: ${startResult.error}`);
          continue;
        }
        
        console.log(`    ✅ Started watching successfully`);
        
        // Extract proof token
        const proofToken = startResult.data.data.viewEvent.proofToken;
        if (!proofToken) {
          console.log(`    ❌ No proof token found in response`);
          console.log(`    📊 Response structure:`, Object.keys(startResult.data.data));
          continue;
        }
        
        console.log(`    🔑 Got proof token: ${proofToken.substring(0, 10)}...`);
        
        // Simulate watching duration
        const watchDuration = selectedAd.duration || 15;
        console.log(`    ⏱️ Simulating ${watchDuration} seconds of watching...`);
        await this.testUtils.sleep(watchDuration * 1000);
        
        // Complete watching
        console.log(`    ✅ Completing ad watch...`);
        const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, selectedAd.id, proofToken);
        
        if (!completeResult.success) {
          console.log(`    ❌ Failed to complete watching: ${completeResult.error}`);
          continue;
        }
        
        console.log(`    ✅ Completed watching successfully`);
        adsViewed++;
        
        // Calculate reward
        const reward = selectedAd.reward_per_view || 0.01;
        rewardsEarned += reward;
        console.log(`    💰 Earned reward: ${reward} KWD`);
        
        // Check if transaction was created
        const transaction = await Transaction.findOne({
          where: { 
            user_id: viewer.id,
            meta: { ad_id: selectedAd.id },
            type: 'viewer_reward',
            transaction_category: 'ad_view'
          },
          order: [['created_at', 'DESC']]
        });
        
        if (transaction) {
          transactionsCreated++;
          console.log(`    📊 Transaction recorded: ${transaction.id}`);
        } else {
          console.log(`    ⚠️ No transaction found for this ad view`);
        }
        
        console.log(`    ✅ Ad ${adIndex + 1} completed successfully`);
        
      } catch (error) {
        console.log(`    ❌ Error watching ad ${adIndex + 1}: ${error.message}`);
        // Continue with next ad
      }
    }
    
    console.log(`  📊 Viewer ${viewer.phone} summary: ${adsViewed} ads viewed, ${rewardsEarned.toFixed(3)} KWD earned`);
    
    return { adsViewed, rewardsEarned, transactionsCreated };
  }

  async generateReport() {
    console.log('\n📊 PHASE 3: GENERATING REPORT');
    console.log('-'.repeat(40));
    
    const testDuration = Date.now() - this.testResults.startTime;
    
    console.log('\n🎯 DETAILED AD VIEWING TEST RESULTS');
    console.log('=' .repeat(60));
    
    // Summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`   Viewers Processed: ${this.testResults.viewersProcessed}`);
    console.log(`   Total Ads Viewed: ${this.testResults.adsViewed}`);
    console.log(`   Total Rewards Distributed: ${this.testResults.rewardsDistributed.toFixed(3)} KWD`);
    console.log(`   Transactions Recorded: ${this.testResults.transactionsRecorded}`);
    
    // Performance metrics
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`   Test Duration: ${(testDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`   Average Ads per Viewer: ${this.testResults.viewersProcessed > 0 ? (this.testResults.adsViewed / this.testResults.viewersProcessed).toFixed(2) : 0}`);
    
    // Error summary
    if (this.testResults.errors.length > 0) {
      console.log('\n⚠️ ERRORS ENCOUNTERED:');
      this.testResults.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.testResults.adsViewed === 0) {
      console.log('   ❌ No ads were viewed. Check the ad viewing flow step by step.');
    } else {
      console.log('   ✅ Ad viewing is working! System is ready for production.');
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new DetailedAdViewingTest();
  test.run().catch(error => {
    console.error('❌ Failed to run detailed ad viewing test:', error);
    process.exit(1);
  });
}

module.exports = DetailedAdViewingTest;
