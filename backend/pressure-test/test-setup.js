// pressure-test/test-setup.js
// Setup test users and initial data for pressure testing

require('dotenv').config();
const { sequelize, User, Wallet, AdvertiserPackage } = require('../src/models');
const TestUtils = require('./test-utils');
const { TEST_CONFIG, USER_DISTRIBUTION, TEST_DATA } = require('./test-config');

class TestSetup {
  constructor() {
    this.testUtils = new TestUtils();
    this.createdUsers = {
      advertisers: [],
      viewers: [],
      admins: []
    };
  }

  async setup() {
    try {
      this.testUtils.log('🚀 Starting pressure test setup...');
      
      // Reset global counter for fresh test run
      this.testUtils.resetGlobalCounter();
      
      // Create test users
      await this.createTestUsers();
      
      // Setup initial data
      await this.setupInitialData();
      
      this.testUtils.log('✅ Test setup completed successfully');
      return this.createdUsers;
      
    } catch (error) {
      this.testUtils.logError('❌ Test setup failed', error);
      throw error;
    }
  }

  async createTestUsers() {
    this.testUtils.log('👥 Creating test users...');
    
    // Create advertisers
    for (let i = 1; i <= USER_DISTRIBUTION.advertisers; i++) {
      const advertiser = await this.createAdvertiser(i);
      this.createdUsers.advertisers.push(advertiser);
      
      if (i % 50 === 0) {
        this.testUtils.log(`Created ${i} advertisers...`);
      }
    }
    
    // Create viewers
    for (let i = 1; i <= USER_DISTRIBUTION.viewers; i++) {
      const viewer = await this.createViewer(i);
      this.createdUsers.viewers.push(viewer);
      
      if (i % 100 === 0) {
        this.testUtils.log(`Created ${i} viewers...`);
      }
    }
    
    // Create admin
    const admin = await this.createAdmin();
    this.createdUsers.admins.push(admin);
    
    this.testUtils.log(`✅ Created ${this.createdUsers.advertisers.length} advertisers, ${this.createdUsers.viewers.length} viewers, ${this.createdUsers.admins.length} admin`);
  }

  async createAdvertiser(index) {
    const email = this.testUtils.generateTestEmail('advertiser', index);
    const phone = this.testUtils.generateTestPhone(index);
    const name = this.testUtils.generateTestName('Advertiser', index);
    
         const userData = {
       name,
       phone,
       role: 'advertiser',
       kyc_status: 'verified',
       company_name: `Test Company ${index}`,
       license_number: `LIC${index.toString().padStart(4, '0')}`,
       commercial_registration_number: `CR${index.toString().padStart(4, '0')}`,
       signatory_name: `Signatory ${index}`,
       is_active: true
     };

    // Create user in database
    const user = await User.create(userData);
    
    // Create wallet with initial credit
    await Wallet.create({
      user_id: user.id,
      balance: TEST_DATA.advertiserCredit,
      balance_micro: TEST_DATA.advertiserCredit * 1000000,
      held_micro: 0
    });

         return {
       id: user.id,
       phone,
       name,
       role: 'advertiser'
     };
  }

  async createViewer(index) {
    const email = this.testUtils.generateTestEmail('viewer', index);
    const phone = this.testUtils.generateTestPhone(index + 1000); // Different range
    const name = this.testUtils.generateTestName('Viewer', index);
    
         const userData = {
       name,
       phone,
               civil_id: this.testUtils.generateTestCivilId(index), // Use global counter for uniqueness
       role: 'viewer',
       kyc_status: 'verified',
       is_active: true
     };

    // Create user in database
    const user = await User.create(userData);
    
    // Create empty wallet
    await Wallet.create({
      user_id: user.id,
      balance: 0,
      balance_micro: 0,
      held_micro: 0
    });

         return {
       id: user.id,
       phone,
       name,
       role: 'viewer'
     };
  }

  async createAdmin() {
    const email = 'admin@pressure-test.com';
    const phone = this.testUtils.generateTestPhone(999); // Use dynamic generation for admin
    const name = 'Pressure Test Admin';
    
         const userData = {
       name,
       phone,
       role: 'admin',
       kyc_status: 'verified',
       is_active: true
     };

    // Create user in database
    const user = await User.create(userData);
    
    // Create admin wallet
    await Wallet.create({
      user_id: user.id,
      balance: 10000, // Large balance for admin
      balance_micro: 10000 * 1000000,
      held_micro: 0
    });

         return {
       id: user.id,
       phone,
       name,
       role: 'admin'
     };
  }

  async setupInitialData() {
    this.testUtils.log('📦 Setting up initial test data...');
    
    // Verify packages exist
    const packages = await AdvertiserPackage.findAll();
    if (packages.length === 0) {
      throw new Error('No advertiser packages found. Please run seeders first.');
    }
    
    this.testUtils.log(`✅ Found ${packages.length} advertiser packages`);
    
    // Verify database connection
    await sequelize.authenticate();
    this.testUtils.log('✅ Database connection verified');
  }

  async cleanup() {
    try {
      this.testUtils.log('🧹 Cleaning up test data...');
      
             // Delete test users and their wallets
       const testPhones = [
         ...this.createdUsers.advertisers.map(u => u.phone),
         ...this.createdUsers.viewers.map(u => u.phone),
         ...this.createdUsers.admins.map(u => u.phone)
       ];
      
             if (testPhones.length > 0) {
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
         
         // Delete users
         await User.destroy({
           where: { phone: testPhones }
         });
         
         this.testUtils.log(`✅ Cleaned up ${testPhones.length} test users`);
       }
      
    } catch (error) {
      this.testUtils.logError('❌ Cleanup failed', error);
    }
  }

  getTestUsers() {
    return this.createdUsers;
  }

  async finalCleanup() {
    try {
      this.testUtils.log('🧹 Final cleanup - closing database connection...');
      await sequelize.close();
      this.testUtils.log('✅ Database connection closed');
    } catch (error) {
      this.testUtils.logError('❌ Final cleanup failed', error);
    }
  }
}

module.exports = TestSetup;
