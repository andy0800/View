// pressure-test/test-scenarios.js
// Test scenarios for pressure testing

const TestUtils = require('./test-utils');
const { TEST_DATA } = require('./test-config');

class TestScenarios {
  constructor() {
    this.testUtils = new TestUtils();
    this.results = {
      advertisers: { success: 0, failed: 0, details: [] },
      viewers: { success: 0, failed: 0, details: [] },
      admins: { success: 0, failed: 0, details: [] }
    };
  }

     // Advertiser Flow: Login → Buy Packages → Create Ads
   async runAdvertiserFlow(advertiser) {
     try {
       this.testUtils.log(`🏢 Starting advertiser flow for ${advertiser.phone}`);
       
       // 1. Login using OTP
       const loginResult = await this.testUtils.loginWithOtp(advertiser.phone);
       if (!loginResult.success) {
         throw new Error(`Login failed: ${loginResult.error}`);
       }
      
      const token = loginResult.data.data.token;
             this.testUtils.log(`✅ Advertiser logged in: ${advertiser.phone}`);
      
      // 2. Get available packages
      const packagesResult = await this.testUtils.getPackages(advertiser.phone);
      if (!packagesResult.success) {
        throw new Error(`Failed to get packages: ${packagesResult.error}`);
      }
      
      const packages = packagesResult.data.data;
      this.testUtils.log(`📦 Found ${packages.length} packages`);
      
      // 3. Purchase packages (all 4 types)
      const purchasedPackages = [];
      for (const pkg of packages) {
        const purchaseResult = await this.testUtils.purchasePackage(advertiser.phone, pkg.id, TEST_DATA.packageBudget);
        if (purchaseResult.success) {
          purchasedPackages.push(purchaseResult.data.data);
          this.testUtils.log(`✅ Purchased package: ${pkg.name}`);
        } else {
          this.testUtils.logError(`❌ Failed to purchase package ${pkg.name}: ${purchaseResult.error}`);
        }
      }
      
      // 4. Create ads for each purchased package
      const createdAds = [];
      for (const purchasedPkg of purchasedPackages) {
        const adData = {
          title: `Test Ad ${advertiser.id} - ${purchasedPkg.package.name}`,
          description: `Test ad description for ${purchasedPkg.package.name}`,
          section: 'business',
          purchasedPackageId: purchasedPkg.id,
          media: 'test-video.mp4', // Mock video file
          cta_text: 'Learn More',
          cta_link: 'https://example.com',
          cta_enabled: true
        };
        
        const adResult = await this.testUtils.createAd(advertiser.phone, adData);
        if (adResult.success) {
          createdAds.push(adResult.data.data);
          this.testUtils.log(`✅ Created ad: ${adData.title}`);
        } else {
          this.testUtils.logError(`❌ Failed to create ad: ${adResult.error}`);
        }
      }
      
      // Only proceed if we have at least one purchased package
      if (purchasedPackages.length === 0) {
        throw new Error('No packages were purchased successfully');
      }
      
      this.results.advertisers.success++;
             this.results.advertisers.details.push({
         phone: advertiser.phone,
         packagesPurchased: purchasedPackages.length,
         adsCreated: createdAds.length,
         success: true
       });
      
             this.testUtils.log(`✅ Advertiser flow completed: ${advertiser.phone}`);
      return { success: true, purchasedPackages, createdAds };
      
    } catch (error) {
             this.results.advertisers.failed++;
       this.results.advertisers.details.push({
         phone: advertiser.phone,
         error: error.message,
         success: false
       });
       
       this.testUtils.logError(`❌ Advertiser flow failed: ${advertiser.phone}`, error);
      return { success: false, error: error.message };
    }
  }

     // Admin Flow: Login → Approve Ads → Activate Ads
   async runAdminFlow(admin, adsToApprove = []) {
     try {
       this.testUtils.log(`👨‍💼 Starting admin flow for ${admin.phone}`);
       
       // 1. Login using OTP
       const loginResult = await this.testUtils.loginWithOtp(admin.phone);
       if (!loginResult.success) {
         throw new Error(`Login failed: ${loginResult.error}`);
       }
      
      const token = loginResult.data.data.token;
             this.testUtils.log(`✅ Admin logged in: ${admin.phone}`);
      
      // 2. Approve ads
      let approvedCount = 0;
      for (const ad of adsToApprove) {
        const approveResult = await this.testUtils.approveAd(admin.phone, ad.id);
        if (approveResult.success) {
          approvedCount++;
          this.testUtils.log(`✅ Approved ad: ${ad.title}`);
        } else {
          this.testUtils.logError(`❌ Failed to approve ad ${ad.title}: ${approveResult.error}`);
        }
      }
      
      // 3. Activate approved ads
      let activatedCount = 0;
      for (const ad of adsToApprove) {
        const activateResult = await this.testUtils.activateAd(admin.phone, ad.id);
        if (activateResult.success) {
          activatedCount++;
          this.testUtils.log(`✅ Activated ad: ${ad.title}`);
        } else {
          this.testUtils.logError(`❌ Failed to activate ad ${ad.title}: ${activateResult.error}`);
        }
      }
      
      this.results.admins.success++;
             this.results.admins.details.push({
         phone: admin.phone,
         adsApproved: approvedCount,
         adsActivated: activatedCount,
         success: true
       });
      
             this.testUtils.log(`✅ Admin flow completed: ${admin.phone}`);
      return { success: true, approvedCount, activatedCount };
      
    } catch (error) {
      this.results.admins.failed++;
             this.results.admins.details.push({
         phone: admin.phone,
         error: error.message,
         success: false
       });
       
       this.testUtils.logError(`❌ Admin flow failed: ${admin.phone}`, error);
      return { success: false, error: error.message };
    }
  }

     // Viewer Flow: Login → Watch Videos → Earn Rewards
   async runViewerFlow(viewer, availableAds = []) {
     try {
       this.testUtils.log(`👀 Starting viewer flow for ${viewer.phone}`);
       
       // 1. Login using OTP
       const loginResult = await this.testUtils.loginWithOtp(viewer.phone);
       if (!loginResult.success) {
         throw new Error(`Login failed: ${loginResult.error}`);
       }
      
      const token = loginResult.data.data.token;
             this.testUtils.log(`✅ Viewer logged in: ${viewer.phone}`);
      
      // 2. Get available ads
      const adsResult = await this.testUtils.getAvailableAds(viewer.phone);
      if (!adsResult.success) {
        throw new Error(`Failed to get ads: ${adsResult.error}`);
      }
      
      const ads = adsResult.data.data || [];
      this.testUtils.log(`📺 Found ${ads.length} available ads`);
      
      // 3. Watch videos and earn rewards
      let watchedCount = 0;
      let totalReward = 0;
      
      const adsToWatch = ads.slice(0, TEST_DATA.videosPerViewer);
      
      for (const ad of adsToWatch) {
        try {
          // Start watching
          const startResult = await this.testUtils.startWatchingAd(viewer.phone, ad.id);
          if (!startResult.success) {
            this.testUtils.logError(`❌ Failed to start watching ad ${ad.title}: ${startResult.error}`);
            continue;
          }
          
          const proofToken = startResult.data.data.proofToken;
          this.testUtils.log(`▶️ Started watching: ${ad.title}`);
          
          // Simulate video watching time
          await this.testUtils.sleep(ad.package?.duration * 1000 || 10000);
          
          // Complete watching
          const completeResult = await this.testUtils.completeWatchingAd(viewer.phone, proofToken);
          if (completeResult.success) {
            watchedCount++;
            const reward = completeResult.data.data.reward || 0;
            totalReward += reward;
            this.testUtils.log(`✅ Completed watching: ${ad.title}, earned: ${reward} KWD`);
          } else {
            this.testUtils.logError(`❌ Failed to complete watching ad ${ad.title}: ${completeResult.error}`);
          }
          
        } catch (error) {
          this.testUtils.logError(`❌ Error watching ad ${ad.title}:`, error);
        }
      }
      
      // 4. Check final balance
      const balanceResult = await this.testUtils.getWalletBalance(viewer.phone);
      const finalBalance = balanceResult.success ? balanceResult.data.data.balance : 0;
      
      this.results.viewers.success++;
             this.results.viewers.details.push({
         phone: viewer.phone,
         videosWatched: watchedCount,
         totalReward: totalReward,
         finalBalance: finalBalance,
         success: true
       });
      
             this.testUtils.log(`✅ Viewer flow completed: ${viewer.phone} - Watched: ${watchedCount}, Earned: ${totalReward} KWD`);
      return { success: true, watchedCount, totalReward, finalBalance };
      
    } catch (error) {
      this.results.viewers.failed++;
             this.results.viewers.details.push({
         phone: viewer.phone,
         error: error.message,
         success: false
       });
       
       this.testUtils.logError(`❌ Viewer flow failed: ${viewer.phone}`, error);
      return { success: false, error: error.message };
    }
  }

  // Concurrent Flow: Mixed operations
  async runConcurrentFlow(users, operationType = 'mixed') {
    this.testUtils.log(`🔄 Starting concurrent flow with ${users.length} users`);
    
    const promises = users.map(async (user, index) => {
      // Add some randomization to simulate real user behavior
      const delay = Math.random() * 5000; // 0-5 seconds delay
      await this.testUtils.sleep(delay);
      
      switch (operationType) {
        case 'advertiser':
          return this.runAdvertiserFlow(user);
        case 'viewer':
          return this.runViewerFlow(user);
        case 'mixed':
          return user.role === 'advertiser' 
            ? this.runAdvertiserFlow(user)
            : this.runViewerFlow(user);
        default:
          return this.runViewerFlow(user);
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    this.testUtils.log(`✅ Concurrent flow completed: ${results.length} users processed`);
    return results;
  }

  // Get test results
  getResults() {
    return {
      advertisers: this.results.advertisers,
      viewers: this.results.viewers,
      admins: this.results.admins,
      metrics: this.testUtils.getMetrics()
    };
  }

  // Reset results
  resetResults() {
    this.results = {
      advertisers: { success: 0, failed: 0, details: [] },
      viewers: { success: 0, failed: 0, details: [] },
      admins: { success: 0, failed: 0, details: [] }
    };
  }
}

module.exports = TestScenarios;
