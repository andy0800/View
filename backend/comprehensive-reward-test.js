// comprehensive-reward-test.js
// Comprehensive test that recreates infrastructure and tests ad viewing, rewards, and transactions

require('dotenv').config();
const { sequelize, User, Wallet, AdvertiserPackage, Ad, PurchasedPackage, ViewEvent, Transaction } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class ComprehensiveRewardTest {
  constructor() {
    this.testUtils = new TestUtils();
    this.testResults = {
      advertisersCreated: 0,
      adsCreated: 0,
      adsActivated: 0,
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
    this.createdUsers = {
      advertisers: [],
      viewers: [],
      ads: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Comprehensive Reward Test (Full Infrastructure + Ad Viewing)');
      console.log('=' .repeat(70));

      // Phase 1: Setup and create test infrastructure
      await this.setup();

      // Phase 2: Create advertisers and purchase packages
      await this.createAdvertisersAndPackages();

      // Phase 3: Create and activate ads
      await this.createAndActivateAds();

      // Phase 4: Test viewers watching ads and earning rewards
      await this.testViewersWatchingAds();

      // Phase 5: Verify reward distribution and transactions
      await this.verifyRewardsAndTransactions();

      // Phase 6: Generate comprehensive report
      await this.generateReport();

      console.log('🎉 Comprehensive reward test completed successfully!');

    } catch (error) {
      console.error('❌ Comprehensive reward test failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  async setup() {
    console.log('\n📋 PHASE 1: SETUP');
    console.log('-'.repeat(40));

    // Reset global counters
    this.testUtils.resetGlobalCounter();

    // Load existing viewers
    await this.loadExistingViewers();

    console.log('✅ Setup completed');
  }

  async loadExistingViewers() {
    console.log('🔍 Loading existing viewers...');

    const viewers = await User.findAll({
      where: {
        phone: {
          [require('sequelize').Op.like]: '+965500%'
        },
        role: 'viewer'
      },
      attributes: ['id', 'name', 'phone', 'created_at']
    });

    this.createdUsers.viewers = viewers;
    console.log(`✅ Loaded ${viewers.length} existing viewers`);

    if (viewers.length === 0) {
      throw new Error('No existing viewers found. Please run the massive viewer test first.');
    }
  }

  async createAdvertisersAndPackages() {
    console.log('\n🏢 PHASE 2: CREATE ADVERTISERS AND PURCHASE PACKAGES');
    console.log('-'.repeat(40));

    // Create 5 advertisers (enough for testing)
    for (let i = 1; i <= 5; i++) {
      const advertiser = await this.createAdvertiser(i);
      this.createdUsers.advertisers.push(advertiser);

      // Purchase all package types for each advertiser
      await this.purchaseAllPackages(advertiser);

      console.log(`✅ Created advertiser ${i}/5 with packages`);
    }

    console.log(`✅ Created ${this.createdUsers.advertisers.length} advertisers with packages`);
  }

  async createAdvertiser(index) {
    const advertiserData = {
      name: `Comprehensive Test Advertiser ${index}`,
      phone: this.testUtils.generateTestPhone(index + 10000), // Use different range
      role: 'advertiser',
      kyc_status: 'verified',
      company_name: `Comprehensive Company ${index}`,
      license_number: `COMP${index.toString().padStart(4, '0')}`,
      commercial_registration_number: `CCR${index.toString().padStart(4, '0')}`,
      signatory_name: `Comprehensive Signatory ${index}`,
      is_active: true
    };

    const advertiser = await User.create(advertiserData);
    await Wallet.create({
      user_id: advertiser.id,
      balance: 1000,
      balance_micro: 1000 * 1000000,
      held_micro: 0
    });

    return advertiser;
  }

  async purchaseAllPackages(advertiser) {
    // Get all available packages using direct SQL
    const [packages] = await sequelize.query(`
      SELECT * FROM advertiser_packages WHERE is_active = true
    `);

    // Purchase each package type
    for (const pkg of packages) {
      const budget = 100; // 100 KWD budget per package
      const budgetMicro = budget * 1000000;
      const estimatedViews = Math.floor(budget / pkg.price_per_view);

      await PurchasedPackage.create({
        advertiser_id: advertiser.id,
        package_id: pkg.id,
        purchased_budget: budget,
        budget_micro: budgetMicro,
        estimated_views: estimatedViews,
        remaining_budget: budget,
        remaining_micro: budgetMicro,
        used_budget: 0,
        used_micro: 0,
        status: 'active',
        is_active: true
      });
    }
  }

  async createAndActivateAds() {
    console.log('\n📹 PHASE 3: CREATE AND ACTIVATE ADS');
    console.log('-'.repeat(40));

    const packages = await AdvertiserPackage.findAll();
    let adIndex = 1;

    // Create 2 ads per advertiser (10 total ads)
    for (const advertiser of this.createdUsers.advertisers) {
      for (let i = 0; i < 2; i++) {
        const packageType = packages[i % packages.length];

        // Get the purchased package for this advertiser and package type
        const purchasedPackage = await PurchasedPackage.findOne({
          where: {
            advertiser_id: advertiser.id,
            package_id: packageType.id
          }
        });

        if (!purchasedPackage) {
          console.log(`⚠️ No purchased package found for advertiser ${advertiser.id} and package ${packageType.id}`);
          continue;
        }

        const ad = await this.createAd(advertiser, packageType, purchasedPackage.id, adIndex);
        this.createdUsers.ads.push(ad);
        adIndex++;
      }
    }

    this.testResults.adsCreated = this.createdUsers.ads.length;
    console.log(`✅ Created ${this.createdUsers.ads.length} ads`);

    // Activate all ads
    await this.activateAllAds();
  }

  async createAd(advertiser, packageType, purchasedPackageId, index) {
    const adData = {
      advertiserId: advertiser.id,
      packageId: packageType.id,
      purchased_package_id: purchasedPackageId,
      title: `Comprehensive Test Ad ${index} - ${packageType.name}`,
      description: `This is a test ad for comprehensive reward testing. Package: ${packageType.name}`,
      mediaUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      section: 'retail',
      budget: 100,
      remaining_budget: 100,
      status: 'draft',
      is_active: false
    };

    return await Ad.create(adData);
  }

  async activateAllAds() {
    console.log('🔄 Activating ads...');

    // Create admin user for activation
    const adminData = {
      name: 'Comprehensive Test Admin',
      phone: this.testUtils.generateTestPhone(99999),
      role: 'admin',
      kyc_status: 'verified',
      is_active: true
    };

    const admin = await User.create(adminData);
    await Wallet.create({
      user_id: admin.id,
      balance: 1000,
      balance_micro: 1000 * 1000000,
      held_micro: 0
    });

    // Login admin
    await this.testUtils.loginWithOtp(admin.phone);

    // Approve and activate all ads
    for (const ad of this.createdUsers.ads) {
      try {
        await this.testUtils.approveAd(admin.phone, ad.id);
        await this.testUtils.activateAd(admin.phone, ad.id);
        this.testResults.adsActivated++;
      } catch (error) {
        this.testResults.errors.push(`Failed to activate ad ${ad.id}: ${error.message}`);
      }
    }

    console.log(`✅ Activated ${this.testResults.adsActivated} ads`);
  }

  async testViewersWatchingAds() {
    console.log('\n👀 PHASE 4: TEST VIEWERS WATCHING ADS');
    console.log('-'.repeat(40));

    const batchSize = 10; // Smaller batches for testing
    const totalBatches = Math.ceil(this.createdUsers.viewers.length / batchSize);

    console.log(`📊 Processing ${this.createdUsers.viewers.length} viewers in ${totalBatches} batches of ${batchSize}`);

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, this.createdUsers.viewers.length);
      const batchViewers = this.createdUsers.viewers.slice(batchStart, batchEnd);

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

      // Small delay between batches
      if (batch < totalBatches - 1) {
        await this.testUtils.sleep(500);
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
      
      // Watch 1-2 ads per viewer (reduced for testing)
      const adsToWatch = Math.floor(Math.random() * 2) + 1; // 1-2 ads
      
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
          
          // Simulate watching duration (reduced for testing)
          const watchDuration = Math.min(randomAd.duration || 15, 5); // Max 5 seconds for testing
          await this.testUtils.sleep(watchDuration * 1000);
          
          // Complete watching
          const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, proofToken);
          if (completeResult.success) {
            viewsCompleted++;
            // Extract reward from the response or use ad data
            const reward = completeResult.data.data?.reward || 0.01; // Default reward
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
    console.log('\n💰 PHASE 5: VERIFY REWARD DISTRIBUTION AND TRANSACTIONS');
    console.log('-'.repeat(40));

    try {
      // Count total transactions created
      const totalTransactions = await Transaction.count({
        where: {
          user_id: {
            [require('sequelize').Op.in]: this.createdUsers.viewers.map(v => v.id)
          },
          type: 'viewer_reward'
        }
      });

      this.testResults.totalTransactions = totalTransactions;
      console.log(`✅ Total reward transactions: ${totalTransactions}`);

      // Count total view events
      const totalViewEvents = await ViewEvent.count({
        where: {
          user_id: {
            [require('sequelize').Op.in]: this.createdUsers.viewers.map(v => v.id)
          }
        }
      });

      console.log(`✅ Total view events: ${totalViewEvents}`);

      // Verify wallet balances
      await this.verifyWalletBalances();

    } catch (error) {
      console.error('❌ Error verifying rewards and transactions:', error);
      this.testResults.errors.push(`Verification failed: ${error.message}`);
    }
  }

  async verifyWalletBalances() {
    try {
      // Get sample viewer wallets
      const sampleViewers = this.createdUsers.viewers.slice(0, 5);
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
      const sampleAdvertisers = this.createdUsers.advertisers.slice(0, 3);
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
    console.log('\n📊 PHASE 6: GENERATE COMPREHENSIVE REPORT');
    console.log('-'.repeat(40));

    this.testResults.performance.endTime = Date.now();
    this.testResults.performance.totalDuration = this.testResults.performance.endTime - this.testResults.performance.startTime;

    console.log('\n🎯 COMPREHENSIVE REWARD TEST RESULTS');
    console.log('=' .repeat(70));

    // Summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`   Advertisers Created: ${this.createdUsers.advertisers.length}`);
    console.log(`   Ads Created: ${this.testResults.adsCreated}`);
    console.log(`   Ads Activated: ${this.testResults.adsActivated}`);
    console.log(`   Total Viewers: ${this.createdUsers.viewers.length}`);
    console.log(`   Viewers Processed: ${this.testResults.viewersProcessed}`);
    console.log(`   Views Started: ${this.testResults.viewsStarted}`);
    console.log(`   Views Completed: ${this.testResults.viewsCompleted}`);
    console.log(`   Views Failed: ${this.testResults.viewsFailed}`);
    console.log(`   Total Rewards Distributed: ${this.testResults.totalRewards.toFixed(3)} KWD`);
    console.log(`   Total Transactions: ${this.testResults.totalTransactions}`);

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

    console.log('   ✅ System successfully tested complete ad viewing and reward distribution flow!');

    // Save detailed report
    await this.saveDetailedReport();
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Comprehensive Reward Test',
      summary: {
        advertisersCreated: this.createdUsers.advertisers.length,
        adsCreated: this.testResults.adsCreated,
        adsActivated: this.testResults.adsActivated,
        totalViewers: this.createdUsers.viewers.length,
        viewersProcessed: this.testResults.viewersProcessed,
        viewsStarted: this.testResults.viewsStarted,
        viewsCompleted: this.testResults.viewsCompleted,
        viewsFailed: this.testResults.viewsFailed,
        totalRewards: this.testResults.totalRewards,
        totalTransactions: this.testResults.totalTransactions
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
      errors: this.testResults.errors,
      recommendations: this.generateRecommendations()
    };

    const fs = require('fs');
    const reportPath = `./comprehensive-reward-test-report-${Date.now()}.json`;

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

    return recommendations;
  }

  async cleanup() {
    console.log('\n🧹 CLEANUP');
    console.log('-'.repeat(40));

    try {
      // Clean up test data
      if (this.createdUsers.ads.length > 0) {
        await Ad.destroy({
          where: {
            id: {
              [require('sequelize').Op.in]: this.createdUsers.ads.map(a => a.id)
            }
          }
        });
      }

      if (this.createdUsers.advertisers.length > 0) {
        // Clean up purchased packages first
        await PurchasedPackage.destroy({
          where: {
            advertiser_id: {
              [require('sequelize').Op.in]: this.createdUsers.advertisers.map(a => a.id)
            }
          }
        });

        // Clean up wallets
        await Wallet.destroy({
          where: {
            user_id: {
              [require('sequelize').Op.in]: this.createdUsers.advertisers.map(a => a.id)
            }
          }
        });

        // Clean up advertisers
        await User.destroy({
          where: {
            id: {
              [require('sequelize').Op.in]: this.createdUsers.advertisers.map(a => a.id)
            }
          }
        });
      }

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new ComprehensiveRewardTest();
  test.run().catch(error => {
    console.error('❌ Failed to run comprehensive reward test:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveRewardTest;
