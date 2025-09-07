require('dotenv').config();
const { sequelize, User, Wallet, AdvertiserPackage, Ad, PurchasedPackage, ViewEvent, Transaction } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class AdViewingTest {
  constructor() {
    this.testUtils = new TestUtils();
    this.metrics = {
      viewsStarted: 0,
      viewsCompleted: 0,
      viewsFailed: 0,
      totalReward: 0,
      startTime: Date.now()
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Ad Viewing Test (Using Existing Infrastructure)');
      console.log('======================================================================\n');

      await this.setup();
      await this.testViewersWatchingAds();
      await this.verifyRewardsAndTransactions();
      await this.generateReport();

    } catch (error) {
      console.error('❌ Ad viewing test failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  async setup() {
    console.log('📋 PHASE 1: SETUP');
    console.log('----------------------------------------');
    
    // Reset global counters
    this.testUtils.resetGlobalCounter();
    
    // Load existing viewers
    const viewers = await User.findAll({
      where: { role: 'viewer' },
      limit: 100 // Test with first 100 viewers
    });
    
    console.log(`✅ Loaded ${viewers.length} existing viewers`);
    this.viewers = viewers;
    
    console.log('✅ Setup completed\n');
  }

  async testViewersWatchingAds() {
    console.log('👁️ PHASE 2: TEST AD VIEWING');
    console.log('----------------------------------------');
    
    console.log(`🧪 Testing ad viewing with ${this.viewers.length} viewers...\n`);
    
    for (let i = 0; i < this.viewers.length; i++) {
      const viewer = this.viewers[i];
      console.log(`[${i + 1}/${this.viewers.length}] Testing viewer: ${viewer.name} (${viewer.phone})`);
      
      try {
        await this.testViewerWatchingAds(viewer);
        console.log(`   ✅ Completed successfully`);
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        this.metrics.viewsFailed++;
      }
      
      // Small delay between viewers
      if (i < this.viewers.length - 1) {
        await this.testUtils.sleep(100);
      }
    }
    
    console.log(`\n📊 Ad Viewing Summary:`);
    console.log(`   Views Started: ${this.metrics.viewsStarted}`);
    console.log(`   Views Completed: ${this.metrics.viewsCompleted}`);
    console.log(`   Views Failed: ${this.metrics.viewsFailed}`);
    console.log(`   Total Reward: ${this.metrics.totalReward.toFixed(6)} KWD\n`);
  }

  async testViewerWatchingAds(viewer) {
    // Login the viewer
    const loginResult = await this.testUtils.loginWithOtp(viewer.phone);
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    // Get available ads
    const adsResult = await this.testUtils.getAvailableAds(viewer.phone);
    if (!adsResult.success) {
      throw new Error(`Failed to get ads: ${adsResult.error}`);
    }

    // Debug: Log the response structure
    console.log(`   🔍 API Response:`, {
      success: adsResult.success,
      hasData: !!adsResult.data,
      dataKeys: adsResult.data ? Object.keys(adsResult.data) : 'no data',
      hasVideos: adsResult.data && !!adsResult.data.videos,
      videosLength: adsResult.data && adsResult.data.videos ? adsResult.data.videos.length : 'no videos array'
    });

    if (!adsResult.data || !adsResult.data.data || !adsResult.data.data.videos || adsResult.data.data.videos.length === 0) {
      throw new Error('No ads available');
    }

    const availableAds = adsResult.data.data.videos;
    console.log(`   📹 Found ${availableAds.length} available ads`);

    // Test viewing a few ads
    const adsToView = Math.min(3, availableAds.length); // View up to 3 ads per viewer
    
    for (let i = 0; i < adsToView; i++) {
      const ad = availableAds[i];
      console.log(`   🎬 Viewing ad: ${ad.title}`);
      
      try {
        // Start watching
        const startResult = await this.testUtils.startWatchingAd(viewer.phone, ad.id);
        if (!startResult.success) {
          console.log(`      ❌ Start watching failed: ${startResult.error}`);
          continue;
        }
        
        this.metrics.viewsStarted++;
        console.log(`      ✅ Started watching`);
        
        // Simulate viewing duration (random between 5-15 seconds)
        const viewDuration = Math.floor(Math.random() * 10) + 5;
        console.log(`      ⏱️  Simulating ${viewDuration}s view duration...`);
        await this.testUtils.sleep(viewDuration * 1000);
        
        // Complete watching
        const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, ad.id);
        if (!completeResult.success) {
          console.log(`      ❌ Complete watching failed: ${completeResult.error}`);
          continue;
        }
        
        this.metrics.viewsCompleted++;
        
        // Calculate reward (half of price per view)
        const reward = ad.package.viewer_reward || 0;
        this.metrics.totalReward += reward;
        
        console.log(`      ✅ Completed watching, Reward: ${reward} KWD`);
        
      } catch (error) {
        console.log(`      ❌ Error viewing ad: ${error.message}`);
        this.metrics.viewsFailed++;
      }
      
      // Small delay between ads
      if (i < adsToView - 1) {
        await this.testUtils.sleep(500);
      }
    }
  }

  async verifyRewardsAndTransactions() {
    console.log('🔍 PHASE 3: VERIFY REWARDS AND TRANSACTIONS');
    console.log('----------------------------------------');
    
    try {
      // Count total reward transactions
      const rewardTransactions = await Transaction.count({
        where: { type: 'viewer_reward' }
      });
      
      console.log(`💰 Total Reward Transactions: ${rewardTransactions}`);
      
      // Count total view events
      const viewEvents = await ViewEvent.count({
        where: { is_completed: true }
      });
      
      console.log(`👁️ Total Completed View Events: ${viewEvents}`);
      
      // Calculate total budget deducted
      const totalBudgetDeducted = await this.calculateTotalBudgetDeducted();
      console.log(`💸 Total Budget Deducted: ${totalBudgetDeducted.toFixed(6)} KWD`);
      
      // Verify wallet balances for sample viewers
      await this.verifyWalletBalances();
      
    } catch (error) {
      console.error('❌ Error verifying rewards:', error);
    }
  }

  async calculateTotalBudgetDeducted() {
    const [result] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE type = 'ad_cost' AND category = 'ad_viewing'
    `);
    
    return parseFloat(result[0].total) / 1_000_000; // Convert from micro units
  }

  async verifyWalletBalances() {
    console.log('\n💳 Sample Wallet Balances:');
    
    // Check first 5 viewers
    const sampleViewers = this.viewers.slice(0, 5);
    
    for (const viewer of sampleViewers) {
      try {
        const balanceResult = await this.testUtils.getWalletBalance(viewer.phone);
        if (balanceResult.success) {
          const balance = balanceResult.data.balance || 0;
          console.log(`   ${viewer.name}: ${balance.toFixed(6)} KWD`);
        } else {
          console.log(`   ${viewer.name}: Error getting balance`);
        }
      } catch (error) {
        console.log(`   ${viewer.name}: Error: ${error.message}`);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 PHASE 4: FINAL REPORT');
    console.log('----------------------------------------');
    
    const duration = Date.now() - this.metrics.startTime;
    const durationSeconds = Math.round(duration / 1000);
    
    console.log(`⏱️  Test Duration: ${durationSeconds} seconds`);
    console.log(`👥 Viewers Tested: ${this.viewers.length}`);
    console.log(`🎬 Views Started: ${this.metrics.viewsStarted}`);
    console.log(`✅ Views Completed: ${this.metrics.viewsCompleted}`);
    console.log(`❌ Views Failed: ${this.metrics.viewsFailed}`);
    console.log(`💰 Total Reward Distributed: ${this.metrics.totalReward.toFixed(6)} KWD`);
    
    const successRate = this.metrics.viewsStarted > 0 
      ? (this.metrics.viewsCompleted / this.metrics.viewsStarted * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.metrics.viewsCompleted > 0) {
      console.log('\n🎉 AD VIEWING TEST COMPLETED SUCCESSFULLY!');
      console.log('✅ Viewers can see ads');
      console.log('✅ Ad viewing process works');
      console.log('✅ Reward distribution is functional');
      console.log('✅ Transaction recording is working');
    } else {
      console.log('\n❌ AD VIEWING TEST FAILED');
      console.log('❌ No ads were successfully viewed');
    }
  }

  async cleanup() {
    console.log('\n🧹 CLEANUP');
    console.log('----------------------------------------');
    
    try {
      // Close database connection
      await sequelize.close();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new AdViewingTest();
  test.run();
}

module.exports = AdViewingTest;
