// backend/setup.js
require('dotenv').config();
const { sequelize } = require('./src/models');
const path = require('path'); // Added for path.join

async function setup() {
  try {
    console.log('🔄 Setting up VIEW app database...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 2. Sync database (recreate all tables)
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // 3. Run migrations
    console.log('🔄 Running migrations...');
    try {
      const migrationPath = path.join(__dirname, 'src', 'migrations', '20250101-create-purchased-packages.js');
      const migration = require(migrationPath);
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
      console.log('✅ Purchased packages migration completed');
    } catch (err) {
      console.log('⚠️ Migration already applied or failed:', err.message);
    }

    // Import and run seeders
    console.log('🔄 Running seeders...');
    
    // Seed sections
    const sectionsSeeder = require('./src/seeders/20250101-seed-business-sections');
    await sectionsSeeder.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Business sections seeded');

    // Seed advertiser packages
    const packagesSeeder = require('./src/seeders/20250101-seed-advertiser-packages');
    await packagesSeeder.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Advertiser packages seeded');

    // Create dummy advertiser with 1,000,000 KWD
    console.log('🔄 Creating dummy advertiser...');
    const { User, Wallet, CompanyWallet } = require('./src/models');
    
    const dummyAdvertiser = await User.create({
      name: 'Test Advertiser',
      phone: '+96550000000',
      role: 'advertiser',
      kyc_status: 'verified',
      company_name: 'Test Company Ltd.',
      license_number: 'TEST123456',
      signatory_name: 'Test Signatory',
      license_doc_key: 'dummy-license.jpg',
      verified_at: new Date(),
      is_active: true
    });

    await Wallet.create({
      user_id: dummyAdvertiser.id,
      balance: 1000000000 // 1,000,000 KWD = 1,000,000,000 fils
    });
    console.log('✅ Dummy advertiser created with 1,000,000 KWD');

    // Create company wallet
    console.log('🔄 Creating company wallet...');
    await CompanyWallet.create({
      company_name: 'View App Company',
      balance: 0,
      total_earnings: 0,
      total_video_views: 0
    });
    console.log('✅ Company wallet created');

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   • Enhanced User model with KYC support');
    console.log('   • ORIGINAL VIEW APP 4-tier Advertiser Package system:');
    console.log('     - 10s package: 10 fils/view (5 fils to viewer, 5 fils to company)');
    console.log('     - 15s package: 13 fils/view (6.5 fils to viewer, 6.5 fils to company)');
    console.log('     - 20s package: 16 fils/view (8 fils to viewer, 8 fils to company)');
    console.log('     - 30s package: 24 fils/view (12 fils to viewer, 12 fils to company)');
    console.log('   • ORIGINAL VIEW APP BUDGET SYSTEM: Packages start at 300 KWD with 100 KWD increments');
    console.log('   • ORIGINAL VIEW APP LOGIC: Advertisers choose their budget (300, 400, 500, 600... KWD)');
    console.log('   • REWARD SYSTEM: Viewers get 50% of original price, company gets 50% (CLASSIFIED)');
    console.log('   • NEW PURCHASED PACKAGES SYSTEM: Track purchased packages with budgets and views');
    console.log('   • Company wallet for transparent earnings tracking');
    console.log('   • Business sections for targeted advertising');
    console.log('   • Test advertiser account with 1,000,000 KWD for testing');
    console.log('\n📧 Dummy advertiser login:');
    console.log('   • Phone: +96550000000');
    console.log('   • Company: Test Company Ltd.');
    console.log('   • Balance: 1,000,000 KWD');
    console.log('   • KYC Status: Verified');
    console.log('\n🚀 You can now start the application!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setup(); 