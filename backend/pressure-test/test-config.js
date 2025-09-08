// pressure-test/test-config.js
// Configuration for 1000 user pressure test

module.exports = {
  // Test Environment Configuration
  TEST_CONFIG: {
    database: 'viewapp_postgres', // Use existing database with test prefixes
    userPrefix: 'pressure_test_',
    maxConcurrentUsers: 1000,
    testDuration: 30 * 60 * 1000, // 30 minutes
    cleanupAfterTest: true,
    batchSize: 50, // Users per batch
    batchDelay: 1000, // 1 second between batches
  },

  // User Distribution
  USER_DISTRIBUTION: {
    advertisers: 250, // 25% advertisers
    viewers: 750,     // 75% viewers
    admins: 1         // 1 admin for approval
  },

  // Test Data Configuration
  TEST_DATA: {
    advertiserCredit: 1000, // KWD per advertiser
    packageBudget: 300,     // KWD per package purchase
    adsPerAdvertiser: 4,    // One ad per package type
    videosPerViewer: 10,    // Videos to watch per viewer
  },

  // API Endpoints
        API_ENDPOINTS: {
     baseUrl: 'http://localhost:4001',
     auth: {
       requestOtp: '/auth/request-otp',
       verifyOtp: '/auth/verify-otp',
       register: '/auth/register'
     },
         advertiser: {
       packages: '/api/advertiser/packages',
       purchasePackage: '/api/advertiser/packages/purchase',
       createAd: '/api/advertiser/ads',
       getAds: '/api/advertiser/ads',
       getPurchasedPackages: '/api/advertiser/packages/purchased'
     },
         admin: {
       getAds: '/api/admin/ads',
       approveAd: '/api/admin/ads/:id/approve',
       activateAd: '/api/admin/ads/:id/activate'
     },
         viewer: {
       getAds: '/api/viewer/all-ads',
       startWatching: '/api/viewer/ads/:adId/start',
       completeWatching: '/api/viewer/ads/:adId/complete',
       getBalance: '/api/viewer/wallet/balance'
     },
         wallet: {
       getBalance: '/api/wallet/balance',
       addCredit: '/api/wallet/add-credit'
     }
  },

  // Performance Thresholds
  PERFORMANCE_THRESHOLDS: {
    maxResponseTime: 2000, // 2 seconds
    maxErrorRate: 0.05,    // 5%
    maxConcurrentConnections: 100,
    maxDatabaseConnections: 50
  },

  // Test Phases
  TEST_PHASES: {
    SETUP: 'setup',
    ADVERTISER: 'advertiser',
    ADMIN: 'admin',
    VIEWER: 'viewer',
    CONCURRENT: 'concurrent',
    CLEANUP: 'cleanup'
  }
};
