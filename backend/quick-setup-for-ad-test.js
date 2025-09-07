// quick-setup-for-ad-test.js
// Quick setup to recreate infrastructure for ad viewing test

require('dotenv').config();
const { sequelize, User, Wallet, AdvertiserPackage, Ad, PurchasedPackage } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

class QuickSetupForAdTest {
  constructor() {
    this.testUtils = new TestUtils();
    this.createdUsers = {
      advertisers: [],
      admins: []
    };
    this.createdAds = [];
  }

  async run() {
    try {
      console.log('🚀 Quick Setup for Ad Viewing Test');
      console.log('=' .repeat(50));
      
      // Phase 1: Create admin
      await this.createAdmin();
      
      // Phase 2: Create advertisers and purchase packages
      await this.createAdvertisersAndPackages();
      
      // Phase 3: Create ads
      await this.createAds();
      
      // Phase 4: Approve and activate ads
      await this.approveAndActivateAds();
      
      console.log('🎉 Quick setup completed successfully!');
      
    } catch (error) {
      console.error('❌ Quick setup failed:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  }

  async createAdmin() {
    console.log('\n👑 Creating admin...');
    
    const adminData = {
      name: 'Quick Test Admin',
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
    console.log('\n🏢 Creating advertisers and packages...');
    
    // Create 5 advertisers (20 ads per advertiser = 100 ads)
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
      name: `Quick Test Advertiser ${index}`,
      phone: this.testUtils.generateTestPhone(index + 1000000),
      role: 'advertiser',
      kyc_status: 'verified',
      company_name: `Quick Company ${index}`,
      license_number: `QUICK${index.toString().padStart(4, '0')}`,
      commercial_registration_number: `QCR${index.toString().padStart(4, '0')}`,
      signatory_name: `Quick Signatory ${index}`,
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
    console.log('\n📹 Creating ads...');
    
    const packages = await AdvertiserPackage.findAll();
    let adIndex = 1;
    
    // Create 20 ads per advertiser (5 advertisers = 100 ads)
    for (const advertiser of this.createdUsers.advertisers) {
      for (let i = 0; i < 20; i++) {
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
    
    console.log(`✅ Created ${this.createdAds.length} ads across all package types`);
  }

  async createAd(advertiser, packageType, purchasedPackageId, index) {
    const adData = {
      advertiserId: advertiser.id,
      packageId: packageType.id,
      purchased_package_id: purchasedPackageId,
      title: `Quick Test Ad ${index} - ${packageType.name}`,
      description: `This is a test ad for quick ad viewing testing. Package: ${packageType.name}`,
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
    console.log('\n✅ Approving and activating ads...');
    
    const admin = this.createdUsers.admins[0];
    
    // Login admin
    await this.testUtils.loginWithOtp(admin.phone);
    
    // Approve all ads
    for (const ad of this.createdAds) {
      try {
        await this.testUtils.approveAd(admin.phone, ad.id);
        await this.testUtils.activateAd(admin.phone, ad.id);
      } catch (error) {
        console.log(`⚠️ Failed to approve/activate ad ${ad.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Processed ${this.createdAds.length} ads for approval/activation`);
  }
}

// Run the setup
if (require.main === module) {
  const setup = new QuickSetupForAdTest();
  setup.run().catch(error => {
    console.error('❌ Failed to run quick setup:', error);
    process.exit(1);
  });
}

module.exports = QuickSetupForAdTest;
