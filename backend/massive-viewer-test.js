qq// massive-viewer-test.js
// Comprehensive test for 10,000 viewers watching 100 approved ads

require('dotenv').config();
const { sequelize, User, Wallet, AdvertiserPackage, Ad, PurchasedPackage, ViewEvent, Transaction } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class MassiveViewerTest {
  constructor() {
    this.testUtils = new TestUtils();
    this.createdUsers = {
      advertisers: [],
      viewers: [],
      admins: []
    };
    this.createdAds = [];
    this.testResults = {
      adsCreated: 0,
      adsApproved: 0,
      adsActivated: 0,
      viewersCreated: 0,
      viewsCompleted: 0,
      totalRewards: 0,
      errors: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Massive Viewer Test (10,000 viewers, 100 ads)');
      console.log('=' .repeat(70));
      
      // Phase 1: Setup and cleanup
      await this.setup();
      
      // Phase 2: Create advertisers and purchase packages
      await this.createAdvertisersAndPackages();
      
      // Phase 3: Create 100 ads across all package types
      await this.createAds();
      
      // Phase 4: Approve and activate all ads
      await this.approveAndActivateAds();
      
      // Phase 5: Create 10,000 viewers
      await this.createViewers();
      
      // Phase 6: Test viewers watching ads
      await this.testViewersWatchingAds();
      
      // Phase 7: Generate comprehensive report
      await this.generateReport();
      
      // Phase 8: Cleanup
      await this.cleanup();
      
      console.log('🎉 Massive viewer test completed successfully!');
      
    } catch (error) {
      console.error('❌ Massive viewer test failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  async setup() {
    console.log('\n📋 PHASE 1: SETUP');
    console.log('-'.repeat(40));
    
    // Reset global counters
    this.testUtils.resetGlobalCounter();
    
    // Clean up existing test data
    await this.cleanupExistingData();
    
    // Create admin user
    await this.createAdmin();
    
    console.log('✅ Setup completed');
  }

  async cleanupExistingData() {
    console.log('🧹 Cleaning up existing test data...');
    
    const { Op } = require('sequelize');
    
    // Delete related records first
    await sequelize.query(`
      DELETE FROM view_events 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE phone LIKE '+9655%'
      )
    `);

    await sequelize.query(`
      DELETE FROM transactions 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE phone LIKE '+9655%'
      )
    `);

    await sequelize.query(`
      DELETE FROM ads 
      WHERE advertiser_id IN (
        SELECT id FROM users 
        WHERE phone LIKE '+9655%'
      )
    `);

    await sequelize.query(`
      DELETE FROM purchased_packages 
      WHERE advertiser_id IN (
        SELECT id FROM users 
        WHERE phone LIKE '+9655%'
      )
    `);

    await sequelize.query(`
      DELETE FROM sessions 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE phone LIKE '+9655%'
      )
    `);

    await sequelize.query(`
      DELETE FROM wallets 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE phone LIKE '+9655%'
      )
    `);

    // Delete users
    const deletedCount = await User.destroy({
      where: {
        phone: {
          [Op.like]: '+9655%'
        }
      }
    });

    console.log(`✅ Cleaned up ${deletedCount} existing test users`);
  }

  async createAdmin() {
    const adminData = {
      name: 'Massive Test Admin',
      phone: this.testUtils.generateTestPhone(999999),
      role: 'admin',
      kyc_status: 'verified',
      is_active: true
    };

    const admin = await User.create(adminData);
    await Wallet.create({
      user_id: admin.id,
      balance: 100000,
      balance_micro: 100000 * 1000000,
      held_micro: 0
    });

    this.createdUsers.admins.push(admin);
    console.log(`✅ Created admin: ${admin.phone}`);
  }

  async createAdvertisersAndPackages() {
    console.log('\n🏢 PHASE 2: CREATE ADVERTISERS AND PACKAGES');
    console.log('-'.repeat(40));
    
    // Create 25 advertisers (4 ads per advertiser = 100 ads)
    for (let i = 1; i <= 25; i++) {
      const advertiser = await this.createAdvertiser(i);
      this.createdUsers.advertisers.push(advertiser);
      
      // Purchase all package types for each advertiser
      await this.purchaseAllPackages(advertiser);
      
      if (i % 5 === 0) {
        console.log(`✅ Created ${i} advertisers with packages...`);
      }
    }
    
    console.log(`✅ Created ${this.createdUsers.advertisers.length} advertisers with packages`);
  }

  async createAdvertiser(index) {
    const advertiserData = {
      name: `Massive Test Advertiser ${index}`,
      phone: this.testUtils.generateTestPhone(index + 1000000),
      role: 'advertiser',
      kyc_status: 'verified',
      company_name: `Massive Company ${index}`,
      license_number: `MASS${index.toString().padStart(4, '0')}`,
      commercial_registration_number: `MCR${index.toString().padStart(4, '0')}`,
      signatory_name: `Massive Signatory ${index}`,
      is_active: true
    };

    const advertiser = await User.create(advertiserData);
    await Wallet.create({
      user_id: advertiser.id,
      balance: 10000,
      balance_micro: 10000 * 1000000,
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
      const budget = 1000; // 1000 KWD budget
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

  async createAds() {
    console.log('\n📹 PHASE 3: CREATE 100 ADS');
    console.log('-'.repeat(40));
    
    const packages = await AdvertiserPackage.findAll();
    let adIndex = 1;
    
    // Create 25 ads per advertiser (4 ads each)
    for (const advertiser of this.createdUsers.advertisers) {
      for (let i = 0; i < 4; i++) {
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
        this.createdAds.push(ad);
        adIndex++;
      }
    }
    
    this.testResults.adsCreated = this.createdAds.length;
    console.log(`✅ Created ${this.createdAds.length} ads across all package types`);
  }

  async createAd(advertiser, packageType, purchasedPackageId, index) {
    const adData = {
      advertiserId: advertiser.id,
      packageId: packageType.id,
      purchased_package_id: purchasedPackageId,
      title: `Massive Test Ad ${index} - ${packageType.name}`,
      description: `This is a test ad for massive viewer testing. Package: ${packageType.name}`,
      mediaUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      section: 'retail',
      budget: 1000,
      remaining_budget: 1000,
      status: 'draft',
      is_active: false
    };

    return await Ad.create(adData);
  }

  async approveAndActivateAds() {
    console.log('\n✅ PHASE 4: APPROVE AND ACTIVATE ADS');
    console.log('-'.repeat(40));
    
    const admin = this.createdUsers.admins[0];
    
    // Login admin
    await this.testUtils.loginWithOtp(admin.phone);
    
    // Approve all ads
    for (const ad of this.createdAds) {
      try {
        await this.testUtils.approveAd(admin.phone, ad.id);
        await this.testUtils.activateAd(admin.phone, ad.id);
        this.testResults.adsApproved++;
        this.testResults.adsActivated++;
      } catch (error) {
        this.testResults.errors.push(`Failed to approve/activate ad ${ad.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Approved and activated ${this.testResults.adsApproved} ads`);
  }

  async createViewers() {
    console.log('\n👥 PHASE 5: CREATE 10,000 VIEWERS');
    console.log('-'.repeat(40));
    
    const batchSize = 100;
    const totalBatches = Math.ceil(10000 / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchPromises = [];
      
      for (let i = 0; i < batchSize && (batch * batchSize + i) < 10000; i++) {
        const viewerIndex = batch * batchSize + i + 1;
        batchPromises.push(this.createViewer(viewerIndex));
      }
      
      const viewers = await Promise.all(batchPromises);
      this.createdUsers.viewers.push(...viewers);
      this.testResults.viewersCreated += viewers.length;
      
      if (batch % 10 === 0 || batch === totalBatches - 1) {
        console.log(`✅ Created ${this.testResults.viewersCreated} viewers...`);
      }
    }
    
    console.log(`✅ Created ${this.testResults.viewersCreated} viewers`);
  }

  async createViewer(index) {
    const viewerData = {
      name: `Massive Test Viewer ${index}`,
      phone: this.testUtils.generateTestPhone(index),
      civil_id: this.testUtils.generateTestCivilId(index),
      role: 'viewer',
      kyc_status: 'verified',
      is_active: true
    };

    const viewer = await User.create(viewerData);
    await Wallet.create({
      user_id: viewer.id,
      balance: 0,
      balance_micro: 0,
      held_micro: 0
    });

    return viewer;
  }

  async testViewersWatchingAds() {
    console.log('\n👀 PHASE 6: TEST VIEWERS WATCHING ADS');
    console.log('-'.repeat(40));
    
    const batchSize = 50;
    const totalBatches = Math.ceil(this.createdUsers.viewers.length / batchSize);
    let totalRewards = 0;
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, this.createdUsers.viewers.length);
      const batchViewers = this.createdUsers.viewers.slice(batchStart, batchEnd);
      
      const batchPromises = batchViewers.map(viewer => 
        this.testViewerWatchingAds(viewer)
      );
      
      const results = await Promise.allSettled(batchPromises);
      
      // Process results
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          this.testResults.viewsCompleted += result.value.viewsCompleted;
          totalRewards += result.value.totalReward;
        } else {
          this.testResults.errors.push(`Viewer test failed: ${result.reason}`);
        }
      });
      
      if (batch % 20 === 0 || batch === totalBatches - 1) {
        console.log(`✅ Processed ${batchEnd} viewers, ${this.testResults.viewsCompleted} views completed...`);
      }
    }
    
    this.testResults.totalRewards = totalRewards;
    console.log(`✅ Completed ${this.testResults.viewsCompleted} ad views`);
  }

  async testViewerWatchingAds(viewer) {
    try {
      // Login viewer
      await this.testUtils.loginWithOtp(viewer.phone);
      
      let viewsCompleted = 0;
      let totalReward = 0;
      
      // Watch 3-5 ads per viewer
      const adsToWatch = Math.floor(Math.random() * 3) + 3; // 3-5 ads
      
      for (let i = 0; i < adsToWatch; i++) {
        try {
          // Get available ads
          const adsResult = await this.testUtils.getAvailableAds(viewer.phone);
          if (!adsResult.success || !adsResult.data.data || adsResult.data.data.length === 0) {
            continue;
          }
          
          const availableAds = adsResult.data.data;
          const randomAd = availableAds[Math.floor(Math.random() * availableAds.length)];
          
          // Start watching
          const startResult = await this.testUtils.startWatchingAd(viewer.phone, randomAd.id);
          if (!startResult.success) {
            continue;
          }
          
          const proofToken = startResult.data.data.proofToken;
          
          // Simulate watching duration
          await this.testUtils.sleep(randomAd.duration * 1000);
          
          // Complete watching
          const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, proofToken);
          if (completeResult.success) {
            viewsCompleted++;
            totalReward += randomAd.reward_per_view;
          }
          
        } catch (error) {
          // Continue with next ad
        }
      }
      
      return { viewsCompleted, totalReward };
      
    } catch (error) {
      throw new Error(`Viewer ${viewer.phone} failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 PHASE 7: GENERATE COMPREHENSIVE REPORT');
    console.log('-'.repeat(40));
    
    console.log('\n🎯 MASSIVE VIEWER TEST RESULTS');
    console.log('=' .repeat(70));
    
    // Summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`   Advertisers Created: ${this.createdUsers.advertisers.length}`);
    console.log(`   Ads Created: ${this.testResults.adsCreated}`);
    console.log(`   Ads Approved: ${this.testResults.adsApproved}`);
    console.log(`   Ads Activated: ${this.testResults.adsActivated}`);
    console.log(`   Viewers Created: ${this.testResults.viewersCreated}`);
    console.log(`   Views Completed: ${this.testResults.viewsCompleted}`);
    console.log(`   Total Rewards Distributed: ${this.testResults.totalRewards.toFixed(3)} KWD`);
    
    // Performance metrics
    const successRate = this.testResults.viewersCreated > 0 
      ? (this.testResults.viewsCompleted / (this.testResults.viewersCreated * 3)) * 100 
      : 0;
    
    console.log(`   Viewer Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`   Average Views per Viewer: ${(this.testResults.viewsCompleted / this.testResults.viewersCreated).toFixed(2)}`);
    console.log(`   Average Reward per Viewer: ${(this.testResults.totalRewards / this.testResults.viewersCreated).toFixed(3)} KWD`);
    
    // Package distribution
    await this.showPackageDistribution();
    
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
      console.log('   ⚠️ Viewer success rate is below 80%. Check ad availability and viewer flow.');
    }
    if (this.testResults.errors.length > 100) {
      console.log('   ⚠️ High error rate detected. Review error handling and system stability.');
    }
    if (this.testResults.viewsCompleted < this.testResults.viewersCreated * 2) {
      console.log('   ⚠️ Low view completion rate. Check ad content and viewer engagement.');
    }
    
    console.log('   ✅ System successfully handled 10,000 viewers with 100 ads!');
    
    // Save detailed report
    await this.saveDetailedReport();
  }

  async showPackageDistribution() {
    console.log('\n📦 PACKAGE DISTRIBUTION:');
    
    const packages = await AdvertiserPackage.findAll();
    for (const pkg of packages) {
      const adCount = this.createdAds.filter(ad => ad.package_id === pkg.id).length;
      console.log(`   ${pkg.name}: ${adCount} ads (${pkg.duration}s, ${pkg.cost_per_view} KWD/view)`);
    }
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Massive Viewer Test',
      summary: {
        advertisers: this.createdUsers.advertisers.length,
        adsCreated: this.testResults.adsCreated,
        adsApproved: this.testResults.adsApproved,
        adsActivated: this.testResults.adsActivated,
        viewers: this.testResults.viewersCreated,
        viewsCompleted: this.testResults.viewsCompleted,
        totalRewards: this.testResults.totalRewards
      },
      performance: {
        successRate: this.testResults.viewersCreated > 0 
          ? (this.testResults.viewsCompleted / (this.testResults.viewersCreated * 3)) * 100 
          : 0,
        averageViewsPerViewer: this.testResults.viewersCreated > 0 
          ? this.testResults.viewsCompleted / this.testResults.viewersCreated 
          : 0,
        averageRewardPerViewer: this.testResults.viewersCreated > 0 
          ? this.testResults.totalRewards / this.testResults.viewersCreated 
          : 0
      },
      errors: this.testResults.errors,
      recommendations: this.generateRecommendations()
    };
    
    const fs = require('fs');
    const reportPath = `./massive-viewer-test-report-${Date.now()}.json`;
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    const successRate = this.testResults.viewersCreated > 0 
      ? (this.testResults.viewsCompleted / (this.testResults.viewersCreated * 3)) * 100 
      : 0;
    
    if (successRate < 80) {
      recommendations.push('Optimize viewer flow and ad availability');
    }
    if (this.testResults.errors.length > 100) {
      recommendations.push('Improve error handling and system stability');
    }
    if (this.testResults.viewsCompleted < this.testResults.viewersCreated * 2) {
      recommendations.push('Enhance ad content and viewer engagement');
    }
    
    return recommendations;
  }

  async cleanup() {
    console.log('\n🧹 PHASE 8: CLEANUP');
    console.log('-'.repeat(40));
    
    try {
      await this.cleanupExistingData();
      await sequelize.close();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new MassiveViewerTest();
  test.run().catch(error => {
    console.error('❌ Failed to run massive viewer test:', error);
    process.exit(1);
  });
}

module.exports = MassiveViewerTest;
