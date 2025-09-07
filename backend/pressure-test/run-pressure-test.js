// pressure-test/run-pressure-test.js
// Main pressure test runner for 1000 user test

require('dotenv').config();
const TestSetup = require('./test-setup');
const TestScenarios = require('./test-scenarios');
const { TEST_CONFIG, USER_DISTRIBUTION, TEST_PHASES } = require('./test-config');

class PressureTestRunner {
  constructor() {
    this.testSetup = new TestSetup();
    this.testScenarios = new TestScenarios();
    this.testUsers = null;
    this.allCreatedAds = [];
    this.startTime = Date.now();
  }

  async run() {
    try {
      console.log('🚀 Starting 1000 User Pressure Test');
      console.log('=' .repeat(60));
      
      // Phase 1: Setup
      await this.runSetupPhase();
      
      // Phase 2: Advertiser Flow
      await this.runAdvertiserPhase();
      
      // Phase 3: Admin Flow
      await this.runAdminPhase();
      
      // Phase 4: Viewer Flow
      await this.runViewerPhase();
      
      // Phase 5: Concurrent Load Test
      await this.runConcurrentPhase();
      
      // Phase 6: Generate Report
      await this.generateReport();
      
      // Phase 7: Cleanup
      if (TEST_CONFIG.cleanupAfterTest) {
        await this.runCleanupPhase();
      }
      
      console.log('🎉 Pressure test completed successfully!');
      
    } catch (error) {
      console.error('❌ Pressure test failed:', error);
      await this.handleError(error);
    }
  }

  async runSetupPhase() {
    console.log('\n📋 PHASE 1: SETUP');
    console.log('-'.repeat(40));
    
    // Clean up any existing test data first
    console.log('🧹 Cleaning up existing test data...');
    await this.testSetup.cleanup();
    
    // Create test users
    this.testUsers = await this.testSetup.setup();
    
    console.log(`✅ Created ${this.testUsers.advertisers.length} advertisers`);
    console.log(`✅ Created ${this.testUsers.viewers.length} viewers`);
    console.log(`✅ Created ${this.testUsers.admins.length} admin`);
    
    console.log('✅ Setup phase completed');
  }

  async runAdvertiserPhase() {
    console.log('\n🏢 PHASE 2: ADVERTISER FLOW');
    console.log('-'.repeat(40));
    
    const advertisers = this.testUsers.advertisers;
    const batchSize = TEST_CONFIG.batchSize;
    const totalBatches = Math.ceil(advertisers.length / batchSize);
    
    console.log(`Processing ${advertisers.length} advertisers in ${totalBatches} batches...`);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, advertisers.length);
      const batch = advertisers.slice(start, end);
      
      console.log(`\n📦 Processing batch ${i + 1}/${totalBatches} (${batch.length} advertisers)...`);
      
      const promises = batch.map(advertiser => 
        this.testScenarios.runAdvertiserFlow(advertiser)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Collect created ads
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          this.allCreatedAds.push(...result.value.createdAds);
        }
      });
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`✅ Batch ${i + 1} completed: ${successCount}/${batch.length} successful`);
      
      // Add delay between batches
      if (i < totalBatches - 1) {
        await this.testScenarios.testUtils.sleep(TEST_CONFIG.batchDelay);
      }
    }
    
    console.log(`✅ Advertiser phase completed. Created ${this.allCreatedAds.length} ads`);
  }

  async runAdminPhase() {
    console.log('\n👨‍💼 PHASE 3: ADMIN FLOW');
    console.log('-'.repeat(40));
    
    const admin = this.testUsers.admins[0];
    
    if (this.allCreatedAds.length === 0) {
      console.log('⚠️ No ads to approve. Skipping admin phase.');
      return;
    }
    
    console.log(`Processing ${this.allCreatedAds.length} ads for approval...`);
    
    const result = await this.testScenarios.runAdminFlow(admin, this.allCreatedAds);
    
    if (result.success) {
      console.log(`✅ Admin phase completed: ${result.approvedCount} ads approved, ${result.activatedCount} ads activated`);
    } else {
      console.log(`❌ Admin phase failed: ${result.error}`);
    }
  }

  async runViewerPhase() {
    console.log('\n👀 PHASE 4: VIEWER FLOW');
    console.log('-'.repeat(40));
    
    const viewers = this.testUsers.viewers;
    const batchSize = TEST_CONFIG.batchSize;
    const totalBatches = Math.ceil(viewers.length / batchSize);
    
    console.log(`Processing ${viewers.length} viewers in ${totalBatches} batches...`);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, viewers.length);
      const batch = viewers.slice(start, end);
      
      console.log(`\n📺 Processing batch ${i + 1}/${totalBatches} (${batch.length} viewers)...`);
      
      const promises = batch.map(viewer => 
        this.testScenarios.runViewerFlow(viewer)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`✅ Batch ${i + 1} completed: ${successCount}/${batch.length} successful`);
      
      // Add delay between batches
      if (i < totalBatches - 1) {
        await this.testScenarios.testUtils.sleep(TEST_CONFIG.batchDelay);
      }
    }
    
    console.log('✅ Viewer phase completed');
  }

  async runConcurrentPhase() {
    console.log('\n🔄 PHASE 5: CONCURRENT LOAD TEST');
    console.log('-'.repeat(40));
    
    const allUsers = [
      ...this.testUsers.advertisers.slice(0, 50), // 50 advertisers
      ...this.testUsers.viewers.slice(0, 150)     // 150 viewers
    ];
    
    console.log(`Running concurrent test with ${allUsers.length} users...`);
    
    const results = await this.testScenarios.runConcurrentFlow(allUsers, 'mixed');
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`✅ Concurrent phase completed: ${successCount}/${allUsers.length} successful`);
  }

  async generateReport() {
    console.log('\n📊 PHASE 6: GENERATING REPORT');
    console.log('-'.repeat(40));
    
    const results = this.testScenarios.getResults();
    const testDuration = Date.now() - this.startTime;
    
    console.log('\n📈 PRESSURE TEST RESULTS');
    console.log('=' .repeat(60));
    
    // Summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log(`   Total Test Duration: ${Math.round(testDuration / 1000)} seconds`);
    console.log(`   Total Users: ${USER_DISTRIBUTION.advertisers + USER_DISTRIBUTION.viewers + USER_DISTRIBUTION.admins}`);
    console.log(`   Advertisers: ${USER_DISTRIBUTION.advertisers}`);
    console.log(`   Viewers: ${USER_DISTRIBUTION.viewers}`);
    console.log(`   Admins: ${USER_DISTRIBUTION.admins}`);
    
    // Performance Metrics
    console.log('\n⚡ PERFORMANCE METRICS:');
    console.log(`   Total Requests: ${results.metrics.totalRequests}`);
    console.log(`   Successful Requests: ${results.metrics.successfulRequests}`);
    console.log(`   Failed Requests: ${results.metrics.failedRequests}`);
    console.log(`   Error Rate: ${(parseFloat(results.metrics.errorRate) * 100).toFixed(2)}%`);
    console.log(`   Average Response Time: ${results.metrics.averageResponseTime}ms`);
    console.log(`   Max Response Time: ${results.metrics.maxResponseTime}ms`);
    console.log(`   Min Response Time: ${results.metrics.minResponseTime}ms`);
    
    // Business Metrics
    console.log('\n💰 BUSINESS METRICS:');
    console.log(`   Advertiser Success Rate: ${results.advertisers.success}/${results.advertisers.success + results.advertisers.failed}`);
    console.log(`   Viewer Success Rate: ${results.viewers.success}/${results.viewers.success + results.viewers.failed}`);
    console.log(`   Admin Success Rate: ${results.admins.success}/${results.admins.success + results.admins.failed}`);
    
    // Calculate totals
    const totalPackagesPurchased = results.advertisers.details
      .filter(d => d.success)
      .reduce((sum, d) => sum + (d.packagesPurchased || 0), 0);
    
    const totalAdsCreated = results.advertisers.details
      .filter(d => d.success)
      .reduce((sum, d) => sum + (d.adsCreated || 0), 0);
    
    const totalVideosWatched = results.viewers.details
      .filter(d => d.success)
      .reduce((sum, d) => sum + (d.videosWatched || 0), 0);
    
    const totalRewardsEarned = results.viewers.details
      .filter(d => d.success)
      .reduce((sum, d) => sum + (d.totalReward || 0), 0);
    
    console.log(`   Total Packages Purchased: ${totalPackagesPurchased}`);
    console.log(`   Total Ads Created: ${totalAdsCreated}`);
    console.log(`   Total Videos Watched: ${totalVideosWatched}`);
    console.log(`   Total Rewards Earned: ${totalRewardsEarned.toFixed(3)} KWD`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (parseFloat(results.metrics.errorRate) > 0.05) {
      console.log('   ⚠️ Error rate is above 5%. Consider optimizing error handling.');
    }
    if (results.metrics.averageResponseTime > 1000) {
      console.log('   ⚠️ Average response time is above 1 second. Consider performance optimization.');
    }
    if (results.metrics.maxResponseTime > 5000) {
      console.log('   ⚠️ Maximum response time is above 5 seconds. Check for bottlenecks.');
    }
    
    console.log('   ✅ System handled 1000 users successfully!');
    
    // Save detailed report
    await this.saveDetailedReport(results, testDuration);
  }

  async saveDetailedReport(results, testDuration) {
    const report = {
      timestamp: new Date().toISOString(),
      testDuration,
      summary: {
        totalUsers: USER_DISTRIBUTION.advertisers + USER_DISTRIBUTION.viewers + USER_DISTRIBUTION.admins,
        advertisers: USER_DISTRIBUTION.advertisers,
        viewers: USER_DISTRIBUTION.viewers,
        admins: USER_DISTRIBUTION.admins
      },
      performance: results.metrics,
      business: {
        advertisers: results.advertisers,
        viewers: results.viewers,
        admins: results.admins
      },
      recommendations: this.generateRecommendations(results)
    };
    
    const fs = require('fs');
    const reportPath = `./pressure-test/results/pressure-test-report-${Date.now()}.json`;
    
    // Ensure results directory exists
    if (!fs.existsSync('./pressure-test/results')) {
      fs.mkdirSync('./pressure-test/results', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    if (parseFloat(results.metrics.errorRate) > 0.05) {
      recommendations.push('Optimize error handling and add retry mechanisms');
    }
    if (results.metrics.averageResponseTime > 1000) {
      recommendations.push('Implement caching and optimize database queries');
    }
    if (results.metrics.maxResponseTime > 5000) {
      recommendations.push('Identify and resolve performance bottlenecks');
    }
    
    return recommendations;
  }

  async runCleanupPhase() {
    console.log('\n🧹 PHASE 7: CLEANUP');
    console.log('-'.repeat(40));
    
    await this.testSetup.cleanup();
    await this.testSetup.finalCleanup();
    console.log('✅ Cleanup phase completed');
  }

  async handleError(error) {
    console.error('❌ Pressure test encountered an error:', error);
    
    // Attempt cleanup even on error
    try {
      if (this.testSetup) {
        await this.testSetup.cleanup();
        await this.testSetup.finalCleanup();
      }
    } catch (cleanupError) {
      console.error('❌ Cleanup also failed:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run the pressure test
if (require.main === module) {
  const runner = new PressureTestRunner();
  runner.run().catch(error => {
    console.error('❌ Failed to run pressure test:', error);
    process.exit(1);
  });
}

module.exports = PressureTestRunner;
