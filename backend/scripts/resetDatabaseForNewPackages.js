// backend/scripts/resetDatabaseForNewPackages.js
require('dotenv').config();
const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');
const { sequelize, User, Wallet, Ad, ViewEvent, Transaction, AdvertiserPackage, CompanyWallet } = require(modelsPath);

async function resetDatabaseForNewPackages() {
  try {
    console.log('🔄 Starting database reset for new package structure...');

    // 1. Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 2. Set public schema
    await sequelize.query('SET search_path TO public;');
    console.log('✅ Public schema set');

    // 3. Drop all tables and recreate them
    console.log('🔄 Dropping all tables...');
    await sequelize.drop();
    console.log('✅ All tables dropped');

    // 4. Sync database (recreate all tables)
    console.log('🔄 Recreating all tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables recreated');

    // 5. Seed the new advertiser packages
    console.log('🔄 Seeding new advertiser packages...');
    const packagesSeeder = require('../src/seeders/20250101-seed-advertiser-packages');
    await packagesSeeder.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ New advertiser packages seeded');

    // 6. Seed business sections
    console.log('🔄 Seeding business sections...');
    const sectionsSeeder = require('../src/seeders/20250101-seed-business-sections');
    await sectionsSeeder.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Business sections seeded');

    // 7. Create company wallet
    console.log('🔄 Creating company wallet...');
    await CompanyWallet.create({
      company_name: 'View App Company',
      balance: 0, // Start with 0 balance
      total_earnings: 0,
      total_video_views: 0,
      is_active: true
    });
    console.log('✅ Company wallet created');

    // 8. Create dummy advertiser with high credit for testing
    console.log('🔄 Creating dummy advertiser...');
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

    // Create wallet with 1,000,000 KWD for testing
    await Wallet.create({
      user_id: dummyAdvertiser.id,
      balance: 1000000.00
    });
    console.log('✅ Dummy advertiser created with 1,000,000 KWD');

    // 9. Create test viewer account
    console.log('🔄 Creating test viewer account...');
    const testViewer = await User.create({
      name: 'Test Viewer',
      phone: '+96560000000',
      role: 'viewer',
      kyc_status: 'verified',
      civil_id: '000000000000',
      verified_at: new Date(),
      is_active: true
    });

    // Create viewer wallet
    await Wallet.create({
      user_id: testViewer.id,
      balance: 0.00
    });
    console.log('✅ Test viewer account created');

    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 What was implemented:');
    console.log('   • NEW PACKAGE STRUCTURE:');
    console.log('     - 10s package: 10 fils/view (5 fils to viewer, 5 fils to company)');
    console.log('     - 15s package: 13 fils/view (6.5 fils to viewer, 6.5 fils to company)');
    console.log('     - 20s package: 16 fils/view (8 fils to viewer, 8 fils to company)');
    console.log('     - 30s package: 24 fils/view (12 fils to viewer, 12 fils to company)');
    console.log('   • NEW REWARD SYSTEM: Viewers get 50% of original price, company gets 50%');
    console.log('   • All existing data purged and replaced with new structure');
    console.log('   • Test accounts created for testing');
    console.log('\n🔑 Test Accounts:');
    console.log('   • Advertiser: +96550000000 (1,000,000 KWD)');
    console.log('   • Viewer: +96560000000 (0 KWD)');
    console.log('   • Company Wallet: View App Company (0 KWD)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database reset failed:', err);
    console.error('❌ Error stack:', err.stack);
    process.exit(1);
  }
}

// Run the reset
resetDatabaseForNewPackages();
