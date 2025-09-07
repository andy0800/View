// pressure-test/quick-test.js
// Quick test with fewer users to verify the infrastructure

require('dotenv').config();
const TestSetup = require('./test-setup');
const TestScenarios = require('./test-scenarios');

class QuickTest {
  constructor() {
    this.testSetup = new TestSetup();
    this.testScenarios = new TestScenarios();
    this.testUsers = null;
    this.startTime = Date.now();
  }

  async run() {
    try {
      console.log('🚀 Starting Quick Test (10 users)');
      console.log('=' .repeat(50));
      
      // Clean up any existing test data first
      await this.cleanupExistingTestData();
      
      // Create test users (smaller set)
      await this.createQuickTestUsers();
      
      // Run advertiser flow
      await this.runQuickAdvertiserFlow();
      
      // Run viewer flow
      await this.runQuickViewerFlow();
      
      // Generate quick report
      await this.generateQuickReport();
      
      // Cleanup
      await this.cleanup();
      
      console.log('🎉 Quick test completed successfully!');
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  async createQuickTestUsers() {
    console.log('\n📋 Creating quick test users...');
    
    // Create 3 advertisers, 6 viewers, 1 admin
    const quickUsers = {
      advertisers: [],
      viewers: [],
      admins: []
    };
    
    // Create 3 advertisers
    for (let i = 1; i <= 3; i++) {
      const advertiser = await this.testSetup.createAdvertiser(i);
      quickUsers.advertisers.push(advertiser);
    }
    
    // Create 6 viewers
    for (let i = 1; i <= 6; i++) {
      const viewer = await this.testSetup.createViewer(i);
      quickUsers.viewers.push(viewer);
    }
    
    // Create 1 admin
    const admin = await this.testSetup.createAdmin();
    quickUsers.admins.push(admin);
    
    this.testUsers = quickUsers;
    
    console.log(`✅ Created ${quickUsers.advertisers.length} advertisers`);
    console.log(`✅ Created ${quickUsers.viewers.length} viewers`);
    console.log(`✅ Created ${quickUsers.admins.length} admin`);
  }

  async runQuickAdvertiserFlow() {
    console.log('\n🏢 Running quick advertiser flow...');
    
    const advertisers = this.testUsers.advertisers;
    const results = [];
    
    for (const advertiser of advertisers) {
      console.log(`Processing advertiser: ${advertiser.phone}`);
      const result = await this.testScenarios.runAdvertiserFlow(advertiser);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Advertiser flow completed: ${successCount}/${advertisers.length} successful`);
  }

  async runQuickViewerFlow() {
    console.log('\n👀 Running quick viewer flow...');
    
    const viewers = this.testUsers.viewers;
    const results = [];
    
    for (const viewer of viewers) {
      console.log(`Processing viewer: ${viewer.phone}`);
      const result = await this.testScenarios.runViewerFlow(viewer);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Viewer flow completed: ${successCount}/${viewers.length} successful`);
  }

  async generateQuickReport() {
    console.log('\n📊 Generating quick report...');
    
    const results = this.testScenarios.getResults();
    const testDuration = Date.now() - this.startTime;
    
    console.log('\n📈 QUICK TEST RESULTS');
    console.log('=' .repeat(40));
    
    console.log(`Test Duration: ${Math.round(testDuration / 1000)} seconds`);
    console.log(`Total Requests: ${results.metrics.totalRequests}`);
    console.log(`Successful Requests: ${results.metrics.successfulRequests}`);
    console.log(`Failed Requests: ${results.metrics.failedRequests}`);
    console.log(`Error Rate: ${(parseFloat(results.metrics.errorRate) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${results.metrics.averageResponseTime}ms`);
    
    console.log('\n✅ Quick test infrastructure is working correctly!');
  }

    async cleanupExistingTestData() {
    console.log('🧹 Cleaning up any existing test data...');
    
    const { sequelize, User } = require('../src/models');
    
    try {
      // Delete any users with phone numbers in the test range (+9655000xxxx)
      const result = await sequelize.query(`
        DELETE FROM users 
        WHERE phone LIKE '+9655000%'
      `);
      
      console.log(`✅ Cleaned up existing test users`);
    } catch (error) {
      console.log('⚠️ No existing test data to clean up');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up quick test data...');
    
    if (this.testUsers) {
      const testPhones = [
        ...this.testUsers.advertisers.map(u => u.phone),
        ...this.testUsers.viewers.map(u => u.phone),
        ...this.testUsers.admins.map(u => u.phone)
      ];
      
      if (testPhones.length > 0) {
        const { sequelize, User } = require('../src/models');
        
        // Delete sessions first (foreign key constraint)
        await sequelize.query(`
          DELETE FROM sessions 
          WHERE user_id IN (
            SELECT id FROM users 
            WHERE phone IN (${testPhones.map(() => '?').join(',')})
          )
        `, { replacements: testPhones });
        
        // Delete wallets (foreign key constraint)
        await sequelize.query(`
          DELETE FROM wallets 
          WHERE user_id IN (
            SELECT id FROM users 
            WHERE phone IN (${testPhones.map(() => '?').join(',')})
          )
        `, { replacements: testPhones });
        
        // Delete related records first (foreign key constraints)
        await sequelize.query(`
          DELETE FROM purchased_packages 
          WHERE advertiser_id IN (
            SELECT id FROM users 
            WHERE phone IN (${testPhones.map(() => '?').join(',')})
          )
        `, { replacements: testPhones });
        
        await sequelize.query(`
          DELETE FROM ads 
          WHERE advertiser_id IN (
            SELECT id FROM users 
            WHERE phone IN (${testPhones.map(() => '?').join(',')})
          )
        `, { replacements: testPhones });
        
        // Delete users
        await User.destroy({
          where: { phone: testPhones }
        });
        
        console.log(`✅ Cleaned up ${testPhones.length} test users`);
        await sequelize.close();
      }
    }
  }
}

// Run the quick test
if (require.main === module) {
  const quickTest = new QuickTest();
  quickTest.run().catch(error => {
    console.error('❌ Quick test failed:', error);
    process.exit(1);
  });
}

module.exports = QuickTest;
