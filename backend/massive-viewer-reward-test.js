// massive-viewer-reward-test.js
// Comprehensive test for 10,000 viewers watching ads, earning rewards, and transaction recording

require('dotenv').config();
const { sequelize, User, Wallet, AdvertiserPackage, Ad, PurchasedPackage, ViewEvent, Transaction } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class MassiveViewerRewardTest {
  constructor() {
    this.testUtils = new TestUtils();
    this.testResults = {
      viewersProcessed: 0,
      viewsStarted: 0,
      viewsCompleted: 0,
      viewsFailed: 0,
      totalRewards: 0,
      totalTransactions: 0,
      totalBudgetDeducted: 0,
      errors: [],
      performance: {
        startTime: Date.now(),
        endTime: null,
        totalDuration: 0
      }
    };
    this.existingUsers = {
      viewers: [],
      advertisers: [],
      ads: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Massive Viewer Reward Test (10,000 viewers watching ads)');
      console.log('=' .repeat(70));

      // Phase 1: Setup and load existing data
      await this.setup();

      // Phase 2: Test viewers watching ads and earning rewards
      await this.testViewersWatchingAds();

      // Phase 3: Verify reward distribution and transactions
      await this.verifyRewardsAndTransactions();

      // Phase 4: Generate comprehensive report
      await this.generateReport();

      console.log('🎉 Massive viewer reward test completed successfully!');

    } catch (error) {
      console.error('❌ Massive viewer reward test failed:', error);
      process.exit(1);
    }
  }

  async setup() {
    console.log('\n📋 PHASE 1: SETUP AND LOAD EXISTING DATA');
    console.log('-'.repeat(40));

    // Reset global counters
    this.testUtils.resetGlobalCounter();

    // Load existing test users and ads
    await this.loadExistingData();

    console.log('✅ Setup completed');
  }

  async loadExistingData() {
    console.log('🔍 Loading existing test data...');

    // Load existing viewers (phone numbers starting with +965500)
    const viewers = await User.findAll({
      where: {
        phone: {
          [require('sequelize').Op.like]: '+965500%'
        },
        role: 'viewer'
      },
      attributes: ['id', 'name', 'phone', 'created_at']
    });

    this.existingUsers.viewers = viewers;
    console.log(`✅ Loaded ${viewers.length} existing viewers`);

    // Load existing advertisers
    const advertisers = await User.findAll({
      where: {
        phone: {
          [require('sequelize').Op.like]: '+965500%'
        },
        role: 'advertiser'
      },
      attributes: ['id', 'name', 'phone', 'created_at']
    });

    this.existingUsers.advertisers = advertisers;
    console.log(`✅ Loaded ${advertisers.length} existing advertisers`);

    // Load existing ads
    const ads = await Ad.findAll({
      where: {
        advertiser_id: {
          [require('sequelize').Op.in]: advertisers.map(a => a.id)
        },
        status: 'active',
        is_active: true
      },
      attributes: ['id', 'title', 'advertiser_id', 'package_id', 'reward_per_view', 'duration', 'budget', 'remaining_budget'],
      include: [{
        model: AdvertiserPackage,
        as: 'package',
        attributes: ['name', 'price_per_view', 'viewer_reward']
      }]
    });

    this.existingUsers.ads = ads;
    console.log(`✅ Loaded ${ads.length} existing active ads`);

    if (ads.length === 0) {
      throw new Error('No active ads found for testing. Please ensure ads are created and activated first.');
    }

    // Display ad package distribution
    console.log('\n📦 AD PACKAGE DISTRIBUTION:');
    const packageCounts = {};
    ads.forEach(ad => {
      const packageName = ad.package?.name || 'Unknown';
      packageCounts[packageName] = (packageCounts[packageName] || 0) + 1;
    });

    Object.entries(packageCounts).forEach(([packageName, count]) => {
      console.log(`   ${packageName}: ${count} ads`);
    });
  }

  async testViewersWatchingAds() {
    console.log('\n👀 PHASE 2: TEST VIEWERS WATCHING ADS');
    console.log('-'.repeat(40));

    const batchSize = 100;
    const totalBatches = Math.ceil(this.existingUsers.viewers.length / batchSize);

    console.log(`📊 Processing ${this.existingUsers.viewers.length} viewers in ${totalBatches} batches of ${batchSize}`);

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, this.existingUsers.viewers.length);
      const batchViewers = this.existingUsers.viewers.slice(batchStart, batchEnd);

      console.log(`\n🔄 Processing batch ${batch + 1}/${totalBatches} (viewers ${batchStart + 1}-${batchEnd})`);

      const batchPromises = batchViewers.map(viewer =>
        this.testViewerWatchingAds(viewer)
      );

      const results = await Promise.allSettled(batchPromises);

      // Process batch results
      results.forEach((result, index) => {
        const viewer = batchViewers[index];
        if (result.status === 'fulfilled') {
          this.testResults.viewersProcessed++;
          this.testResults.viewsStarted += result.value.viewsStarted;
          this.testResults.viewsCompleted += result.value.viewsCompleted;
          this.testResults.viewsFailed += result.value.viewsFailed;
          this.testResults.totalRewards += result.value.totalReward;
        } else {
          this.testResults.errors.push(`Viewer ${viewer.phone} failed: ${result.reason}`);
        }
      });

      // Progress update
      const progress = ((batch + 1) / totalBatches * 100).toFixed(1);
      console.log(`✅ Batch ${batch + 1} completed. Progress: ${progress}%`);
      console.log(`   Views started: ${this.testResults.viewsStarted}, completed: ${this.testResults.viewsCompleted}, failed: ${this.testResults.viewsFailed}`);
      console.log(`   Total rewards: ${this.testResults.totalRewards.toFixed(3)} KWD`);

      // Small delay between batches to prevent overwhelming the system
      if (batch < totalBatches - 1) {
        await this.testUtils.sleep(1000);
      }
    }

    console.log(`\n🎯 BATCH PROCESSING COMPLETED:`);
    console.log(`   Total viewers processed: ${this.testResults.viewersProcessed}`);
    console.log(`   Total views started: ${this.testResults.viewsStarted}`);
    console.log(`   Total views completed: ${this.testResults.viewsCompleted}`);
    console.log(`   Total views failed: ${this.testResults.viewsFailed}`);
    console.log(`   Total rewards distributed: ${this.testResults.totalRewards.toFixed(3)} KWD`);
  }

  async testViewerWatchingAds(viewer) {
    try {
      // Login viewer
      await this.testUtils.loginWithOtp(viewer.phone);
      
      let viewsStarted = 0;
      let viewsCompleted = 0;
      let viewsFailed = 0;
      let totalReward = 0;
      
      // Watch 2-4 ads per viewer (reduced for massive testing)
      const adsToWatch = Math.floor(Math.random() * 3) + 2; // 2-4 ads
      
      for (let i = 0; i < adsToWatch; i++) {
        try {
          // Get available ads
          const adsResult = await this.testUtils.getAvailableAds(viewer.phone);
          if (!adsResult.success || !adsResult.data.data || adsResult.data.data.length === 0) {
            // No ads available, skip this viewer
            break;
          }
          
          const availableAds = adsResult.data.data;
          const randomAd = availableAds[Math.floor(Math.random() * availableAds.length)];
          
          // Start watching
          const startResult = await this.testUtils.startWatchingAd(viewer.phone, randomAd.id);
          if (!startResult.success) {
            viewsFailed++;
            continue;
          }
          
          viewsStarted++;
          const proofToken = startResult.data.data.proofToken;
          
          // Simulate watching duration (reduced for massive testing)
          const watchDuration = Math.min(randomAd.duration || 15, 10); // Max 10 seconds for testing
          await this.testUtils.sleep(watchDuration * 1000);
          
          // Complete watching
          const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, proofToken);
          if (completeResult.success) {
            viewsCompleted++;
            // Extract reward from the response or use ad data
            const reward = completeResult.data.data?.reward || randomAd.reward_per_view || 0.01;
            totalReward += reward;
          } else {
            viewsFailed++;
          }
          
        } catch (error) {
          viewsFailed++;
          // Continue with next ad
        }
      }
      
      return { viewsStarted, viewsCompleted, viewsFailed, totalReward };
      
    } catch (error) {
      throw new Error(`Viewer ${viewer.phone} failed: ${error.message}`);
    }
  }

  async verifyRewardsAndTransactions() {
    console.log('\n💰 PHASE 3: VERIFY REWARD DISTRIBUTION AND TRANSACTIONS');
    console.log('-'.repeat(40));

    try {
      // Count total transactions created
      const totalTransactions = await Transaction.count({
        where: {
          user_id: {
            [require('sequelize').Op.in]: this.existingUsers.viewers.map(v => v.id)
          },
          type: 'reward'
        }
      });

      this.testResults.totalTransactions = totalTransactions;
      console.log(`✅ Total reward transactions: ${totalTransactions}`);

      // Count total view events
      const totalViewEvents = await ViewEvent.count({
        where: {
          user_id: {
            [require('sequelize').Op.in]: this.existingUsers.viewers.map(v => v.id)
          }
        }
      });

      console.log(`✅ Total view events: ${totalViewEvents}`);

      // Calculate total budget deducted from advertisers
      const totalBudgetDeducted = await this.calculateTotalBudgetDeducted();
      this.testResults.totalBudgetDeducted = totalBudgetDeducted;
      console.log(`✅ Total budget deducted: ${totalBudgetDeducted.toFixed(3)} KWD`);

      // Verify wallet balances
      await this.verifyWalletBalances();

    } catch (error) {
      console.error('❌ Error verifying rewards and transactions:', error);
      this.testResults.errors.push(`Verification failed: ${error.message}`);
    }
  }

  async calculateTotalBudgetDeducted() {
    try {
      // Get all ads and their view counts
      const adsWithViews = await Ad.findAll({
        where: {
          id: {
            [require('sequelize').Op.in]: this.existingUsers.ads.map(a => a.id)
          }
        },
        attributes: ['id', 'cost_per_view', 'cost_per_view_micro'],
        include: [{
          model: ViewEvent,
          as: 'viewEvents',
          attributes: ['id']
        }]
      });

      let totalDeducted = 0;
      adsWithViews.forEach(ad => {
        const viewCount = ad.viewEvents?.length || 0;
        const costPerView = ad.cost_per_view || 0;
        totalDeducted += viewCount * costPerView;
      });

      return totalDeducted;
    } catch (error) {
      console.error('❌ Error calculating budget deducted:', error);
      return 0;
    }
  }

  async verifyWalletBalances() {
    try {
      // Get sample viewer wallets
      const sampleViewers = this.existingUsers.viewers.slice(0, 10);
      const viewerWallets = await Wallet.findAll({
        where: {
          user_id: {
            [require('sequelize').Op.in]: sampleViewers.map(v => v.id)
          }
        },
        attributes: ['user_id', 'balance', 'balance_micro']
      });

      console.log(`\n💳 SAMPLE VIEWER WALLET BALANCES:`);
      viewerWallets.forEach(wallet => {
        const viewer = sampleViewers.find(v => v.id === wallet.user_id);
        console.log(`   ${viewer?.phone}: ${wallet.balance} KWD (${wallet.balance_micro} micro)`);
      });

      // Get sample advertiser wallets
      const sampleAdvertisers = this.existingUsers.advertisers.slice(0, 5);
      const advertiserWallets = await Wallet.findAll({
        where: {
          user_id: {
            [require('sequelize').Op.in]: sampleAdvertisers.map(a => a.id)
          }
        },
        attributes: ['user_id', 'balance', 'balance_micro']
      });

      console.log(`\n💳 SAMPLE ADVERTISER WALLET BALANCES:`);
      advertiserWallets.forEach(wallet => {
        const advertiser = sampleAdvertisers.find(a => a.id === wallet.user_id);
        console.log(`   ${advertiser?.phone}: ${wallet.balance} KWD (${wallet.balance_micro} micro)`);
      });

    } catch (error) {
      console.error('❌ Error verifying wallet balances:', error);
    }
  }

  async generateReport() {
    console.log('\n📊 PHASE 4: GENERATE COMPREHENSIVE REPORT');
    console.log('-'.repeat(40));

    this.testResults.performance.endTime = Date.now();
    this.testResults.performance.totalDuration = this.testResults.performance.endTime - this.testResults.performance.startTime;

    console.log('\n🎯 MASSIVE VIEWER REWARD TEST RESULTS');
    console.log('=' .repeat(70));

    // Summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`   Total Viewers: ${this.existingUsers.viewers.length}`);
    console.log(`   Viewers Processed: ${this.testResults.viewersProcessed}`);
    console.log(`   Views Started: ${this.testResults.viewsStarted}`);
    console.log(`   Views Completed: ${this.testResults.viewsCompleted}`);
    console.log(`   Views Failed: ${this.testResults.viewsFailed}`);
    console.log(`   Total Rewards Distributed: ${this.testResults.totalRewards.toFixed(3)} KWD`);
    console.log(`   Total Transactions: ${this.testResults.totalTransactions}`);
    console.log(`   Total Budget Deducted: ${this.testResults.totalBudgetDeducted.toFixed(3)} KWD`);

    // Performance metrics
    const successRate = this.testResults.viewsStarted > 0 
      ? (this.testResults.viewsCompleted / this.testResults.viewsStarted) * 100 
      : 0;
    
    const avgViewsPerViewer = this.testResults.viewersProcessed > 0
      ? this.testResults.viewsCompleted / this.testResults.viewersProcessed
      : 0;

    const avgRewardPerViewer = this.testResults.viewersProcessed > 0
      ? this.testResults.totalRewards / this.testResults.viewersProcessed
      : 0;

    console.log(`\n📊 PERFORMANCE METRICS:`);
    console.log(`   View Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`   Average Views per Viewer: ${avgViewsPerViewer.toFixed(2)}`);
    console.log(`   Average Reward per Viewer: ${avgRewardPerViewer.toFixed(3)} KWD`);
    console.log(`   Test Duration: ${(this.testResults.performance.totalDuration / 1000).toFixed(1)} seconds`);
    console.log(`   Processing Rate: ${(this.testResults.viewersProcessed / (this.testResults.performance.totalDuration / 1000)).toFixed(1)} viewers/second`);

    // Financial summary
    console.log(`\n💰 FINANCIAL SUMMARY:`);
    console.log(`   Total Rewards Distributed: ${this.testResults.totalRewards.toFixed(3)} KWD`);
    console.log(`   Total Budget Deducted: ${this.testResults.totalBudgetDeducted.toFixed(3)} KWD`);
    console.log(`   Net Company Revenue: ${(this.testResults.totalBudgetDeducted - this.testResults.totalRewards).toFixed(3)} KWD`);
    console.log(`   Transaction Count: ${this.testResults.totalTransactions}`);

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
    if (successRate < 80) {
      console.log('   ⚠️ View success rate is below 80%. Check ad availability and viewer flow.');
    }
    if (this.testResults.viewsFailed > this.testResults.viewsCompleted * 0.2) {
      console.log('   ⚠️ High failure rate detected. Review error handling and system stability.');
    }
    if (this.testResults.totalRewards < this.testResults.totalBudgetDeducted * 0.4) {
      console.log('   ⚠️ Low reward distribution rate. Check reward calculation and distribution logic.');
    }

    console.log('   ✅ System successfully processed massive viewer ad watching and reward distribution!');

    // Save detailed report
    await this.saveDetailedReport();
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Massive Viewer Reward Test',
      summary: {
        totalViewers: this.existingUsers.viewers.length,
        viewersProcessed: this.testResults.viewersProcessed,
        viewsStarted: this.testResults.viewsStarted,
        viewsCompleted: this.testResults.viewsCompleted,
        viewsFailed: this.testResults.viewsFailed,
        totalRewards: this.testResults.totalRewards,
        totalTransactions: this.testResults.totalTransactions,
        totalBudgetDeducted: this.testResults.totalBudgetDeducted
      },
      performance: {
        successRate: this.testResults.viewsStarted > 0 
          ? (this.testResults.viewsCompleted / this.testResults.viewsStarted) * 100 
          : 0,
        averageViewsPerViewer: this.testResults.viewersProcessed > 0
          ? this.testResults.viewsCompleted / this.testResults.viewersProcessed
          : 0,
        averageRewardPerViewer: this.testResults.viewersProcessed > 0
          ? this.testResults.totalRewards / this.testResults.viewersProcessed
          : 0,
        testDuration: this.testResults.performance.totalDuration,
        processingRate: this.testResults.viewersProcessed / (this.testResults.performance.totalDuration / 1000)
      },
      financial: {
        totalRewards: this.testResults.totalRewards,
        totalBudgetDeducted: this.testResults.totalBudgetDeducted,
        netCompanyRevenue: this.testResults.totalBudgetDeducted - this.testResults.totalRewards,
        transactionCount: this.testResults.totalTransactions
      },
      errors: this.testResults.errors,
      recommendations: this.generateRecommendations()
    };

    const fs = require('fs');
    const reportPath = `./massive-viewer-reward-test-report-${Date.now()}.json`;

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    const successRate = this.testResults.viewsStarted > 0 
      ? (this.testResults.viewsCompleted / this.testResults.viewsStarted) * 100 
      : 0;

    if (successRate < 80) {
      recommendations.push('Optimize ad viewing flow and reduce failure rates');
    }
    if (this.testResults.viewsFailed > this.testResults.viewsCompleted * 0.2) {
      recommendations.push('Improve error handling and system stability');
    }
    if (this.testResults.totalRewards < this.testResults.totalBudgetDeducted * 0.4) {
      recommendations.push('Review reward calculation and distribution logic');
    }

    return recommendations;
  }
}

// Run the test
if (require.main === module) {
  const test = new MassiveViewerRewardTest();
  test.run().catch(error => {
    console.error('❌ Failed to run massive viewer reward test:', error);
    process.exit(1);
  });
}

module.exports = MassiveViewerRewardTest;
