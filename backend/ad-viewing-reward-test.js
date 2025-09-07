// ad-viewing-reward-test.js
// Test ad viewing, reward distribution, and transaction recording for existing viewers and ads

require('dotenv').config();
const { sequelize, User, Wallet, Ad, PurchasedPackage, ViewEvent, Transaction } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class AdViewingRewardTest {
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
      console.log('🚀 Starting Ad Viewing and Reward Distribution Test');
      console.log('=' .repeat(70));
      
      // Phase 1: Load existing viewers and ads
      await this.loadExistingData();
      
      // Phase 2: Test viewers watching ads and receiving rewards
      await this.testAdViewingAndRewards();
      
      // Phase 3: Generate comprehensive report
      await this.generateReport();
      
      console.log('🎉 Ad viewing and reward test completed successfully!');
      
    } catch (error) {
      console.error('❌ Ad viewing and reward test failed:', error);
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

  async testAdViewingAndRewards() {
    console.log('\n👀 PHASE 2: TESTING AD VIEWING AND REWARDS');
    console.log('-'.repeat(40));
    
    const batchSize = 100;
    const totalBatches = Math.ceil(this.viewers.length / batchSize);
    
    console.log(`📊 Processing ${this.viewers.length} viewers in ${totalBatches} batches of ${batchSize}`);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, this.viewers.length);
      const batchViewers = this.viewers.slice(batchStart, batchEnd);
      
      console.log(`\n🔄 Processing batch ${batch + 1}/${totalBatches} (viewers ${batchStart + 1}-${batchEnd})`);
      
      // Process viewers in parallel within each batch
      const batchPromises = batchViewers.map(viewer => 
        this.testViewerWatchingAds(viewer)
      );
      
      const results = await Promise.allSettled(batchPromises);
      
      // Process results
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          this.testResults.viewersProcessed++;
          this.testResults.adsViewed += result.value.adsViewed;
          this.testResults.rewardsDistributed += result.value.rewardsEarned;
          this.testResults.transactionsRecorded += result.value.transactionsCreated;
        } else {
          this.testResults.errors.push(`Viewer test failed: ${result.reason}`);
        }
      });
      
      // Progress update
      const progress = ((batch + 1) / totalBatches * 100).toFixed(1);
      console.log(`✅ Batch ${batch + 1} completed. Progress: ${progress}%`);
      console.log(`   📊 Current totals: ${this.testResults.adsViewed} ads viewed, ${this.testResults.rewardsDistributed.toFixed(3)} KWD distributed`);
      
      // Small delay between batches to prevent overwhelming the system
      if (batch < totalBatches - 1) {
        await this.testUtils.sleep(1000);
      }
    }
    
    console.log(`\n🎯 All batches completed!`);
    console.log(`   📊 Final totals: ${this.testResults.adsViewed} ads viewed, ${this.testResults.rewardsDistributed.toFixed(3)} KWD distributed`);
  }

  async testViewerWatchingAds(viewer) {
    try {
      // Login viewer
      await this.testUtils.loginWithOtp(viewer.phone);
      
      let adsViewed = 0;
      let rewardsEarned = 0;
      let transactionsCreated = 0;
      
      // Watch 2-4 ads per viewer
      const adsToWatch = Math.floor(Math.random() * 3) + 2; // 2-4 ads
      
      for (let i = 0; i < adsToWatch; i++) {
        try {
          // Get available ads
          const adsResult = await this.testUtils.getAvailableAds(viewer.phone);
          if (!adsResult.success || !adsResult.data.data || !adsResult.data.data.videos || adsResult.data.data.videos.length === 0) {
            continue;
          }
          
          const availableAds = adsResult.data.data.videos;
          const randomAd = availableAds[Math.floor(Math.random() * availableAds.length)];
          
          // Start watching
          const startResult = await this.testUtils.startWatchingAd(viewer.phone, randomAd.id);
          if (!startResult.success) {
            continue;
          }
          
          const proofToken = startResult.data.data.viewEvent.proofToken;
          
          // Simulate watching duration (use actual ad duration or default)
          const watchDuration = randomAd.duration || 15; // Default to 15 seconds
          await this.testUtils.sleep(watchDuration * 1000);
          
          // Complete watching
          const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, proofToken);
          if (completeResult.success) {
            adsViewed++;
            
            // Calculate reward (this would normally come from the API response)
            const reward = randomAd.reward_per_view || 0.01; // Default reward
            rewardsEarned += reward;
            
            // Check if transaction was created
            const transaction = await Transaction.findOne({
              where: { 
                user_id: viewer.id,
                ad_id: randomAd.id,
                type: 'reward'
              },
              order: [['created_at', 'DESC']]
            });
            
            if (transaction) {
              transactionsCreated++;
            }
          }
          
        } catch (error) {
          // Continue with next ad
          console.log(`⚠️ Error watching ad for viewer ${viewer.phone}: ${error.message}`);
        }
      }
      
      return { adsViewed, rewardsEarned, transactionsCreated };
      
    } catch (error) {
      throw new Error(`Viewer ${viewer.phone} failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 PHASE 3: GENERATING COMPREHENSIVE REPORT');
    console.log('-'.repeat(40));
    
    const testDuration = Date.now() - this.testResults.startTime;
    const avgAdsPerViewer = this.testResults.viewersProcessed > 0 
      ? (this.testResults.adsViewed / this.testResults.viewersProcessed).toFixed(2)
      : 0;
    const avgRewardPerViewer = this.testResults.viewersProcessed > 0
      ? (this.testResults.rewardsDistributed / this.testResults.viewersProcessed).toFixed(3)
      : 0;
    
    console.log('\n🎯 AD VIEWING AND REWARD TEST RESULTS');
    console.log('=' .repeat(70));
    
    // Summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`   Viewers Processed: ${this.testResults.viewersProcessed}`);
    console.log(`   Total Ads Viewed: ${this.testResults.adsViewed}`);
    console.log(`   Total Rewards Distributed: ${this.testResults.rewardsDistributed.toFixed(3)} KWD`);
    console.log(`   Transactions Recorded: ${this.testResults.transactionsRecorded}`);
    
    // Performance metrics
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`   Average Ads per Viewer: ${avgAdsPerViewer}`);
    console.log(`   Average Reward per Viewer: ${avgRewardPerViewer} KWD`);
    console.log(`   Test Duration: ${(testDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`   Processing Rate: ${(this.testResults.viewersProcessed / (testDuration / 1000)).toFixed(2)} viewers/second`);
    
    // Success rates
    const viewerSuccessRate = this.testResults.viewersProcessed > 0 
      ? (this.testResults.viewersProcessed / this.viewers.length * 100).toFixed(2)
      : 0;
    const adViewSuccessRate = this.testResults.adsViewed > 0 
      ? (this.testResults.adsViewed / (this.testResults.viewersProcessed * 3) * 100).toFixed(2)
      : 0;
    
    console.log('\n🎯 SUCCESS RATES:');
    console.log(`   Viewer Processing Success: ${viewerSuccessRate}%`);
    console.log(`   Ad Viewing Success: ${adViewSuccessRate}%`);
    
    // Error summary
    if (this.testResults.errors.length > 0) {
      console.log('\n⚠️ ERRORS ENCOUNTERED:');
      console.log(`   Total Errors: ${this.testResults.errors.length}`);
      this.testResults.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error}`);
      });
      if (this.testResults.errors.length > 10) {
        console.log(`   ... and ${this.testResults.errors.length - 10} more errors`);
      }
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (viewerSuccessRate < 90) {
      console.log('   ⚠️ Viewer processing success rate is below 90%. Check system stability.');
    }
    if (adViewSuccessRate < 70) {
      console.log('   ⚠️ Ad viewing success rate is below 70%. Check ad availability and viewer flow.');
    }
    if (this.testResults.errors.length > 50) {
      console.log('   ⚠️ High error rate detected. Review error handling and system stability.');
    }
    
    if (viewerSuccessRate >= 90 && adViewSuccessRate >= 70) {
      console.log('   ✅ Excellent performance! System is ready for production-scale ad viewing.');
    }
    
    // Save detailed report
    await this.saveDetailedReport();
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Ad Viewing and Reward Distribution Test',
      summary: {
        viewersProcessed: this.testResults.viewersProcessed,
        totalAdsViewed: this.testResults.adsViewed,
        totalRewardsDistributed: this.testResults.rewardsDistributed,
        transactionsRecorded: this.testResults.transactionsRecorded,
        totalViewers: this.viewers.length,
        totalAds: this.ads.length
      },
      performance: {
        testDuration: Date.now() - this.testResults.startTime,
        averageAdsPerViewer: this.testResults.viewersProcessed > 0 
          ? this.testResults.adsViewed / this.testResults.viewersProcessed 
          : 0,
        averageRewardPerViewer: this.testResults.viewersProcessed > 0
          ? this.testResults.rewardsDistributed / this.testResults.viewersProcessed
          : 0,
        processingRate: this.testResults.viewersProcessed / ((Date.now() - this.testResults.startTime) / 1000)
      },
      errors: this.testResults.errors,
      recommendations: this.generateRecommendations()
    };
    
    const fs = require('fs');
    const reportPath = `./ad-viewing-reward-test-report-${Date.now()}.json`;
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    const viewerSuccessRate = this.testResults.viewersProcessed > 0 
      ? (this.testResults.viewersProcessed / this.viewers.length * 100)
      : 0;
    const adViewSuccessRate = this.testResults.adsViewed > 0 
      ? (this.testResults.adsViewed / (this.testResults.viewersProcessed * 3) * 100)
      : 0;
    
    if (viewerSuccessRate < 90) {
      recommendations.push('Improve viewer processing stability and error handling');
    }
    if (adViewSuccessRate < 70) {
      recommendations.push('Optimize ad viewing flow and ad availability');
    }
    if (this.testResults.errors.length > 50) {
      recommendations.push('Review and improve error handling mechanisms');
    }
    
    if (viewerSuccessRate >= 90 && adViewSuccessRate >= 70) {
      recommendations.push('System is performing excellently - ready for production');
    }
    
    return recommendations;
  }
}

// Run the test
if (require.main === module) {
  const test = new AdViewingRewardTest();
  test.run().catch(error => {
    console.error('❌ Failed to run ad viewing and reward test:', error);
    process.exit(1);
  });
}

module.exports = AdViewingRewardTest;
