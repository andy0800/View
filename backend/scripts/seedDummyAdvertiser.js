// backend/scripts/seedDummyAdvertiser.js
require('dotenv').config();
const { User, Wallet } = require('../src/models');

async function seedDummyAdvertiser() {
  try {
    console.log('🔄 Creating dummy advertiser...');

    // Check if dummy advertiser already exists
    const existingUser = await User.findOne({
      where: { phone: '+96550000000' }
    });

    if (existingUser) {
      console.log('⚠️ Dummy advertiser already exists, updating wallet...');
      
      // Update wallet with 1,000,000 KWD
      await Wallet.update(
        { balance: 1000000.00 },
        { where: { user_id: existingUser.id } }
      );
      
      console.log('✅ Dummy advertiser wallet updated with 1,000,000 KWD');
      console.log(`📧 Phone: ${existingUser.phone}`);
      console.log(`🏢 Company: ${existingUser.company_name}`);
      console.log(`💰 Balance: 1,000,000 KWD`);
      return;
    }

    // Create dummy advertiser
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

    // Create wallet with 1,000,000 KWD
    await Wallet.create({
      user_id: dummyAdvertiser.id,
      balance: 1000000.00
    });

    console.log('✅ Dummy advertiser created successfully!');
    console.log(`🆔 ID: ${dummyAdvertiser.id}`);
    console.log(`📧 Phone: ${dummyAdvertiser.phone}`);
    console.log(`🏢 Company: ${dummyAdvertiser.company_name}`);
    console.log(`💰 Balance: 1,000,000 KWD`);
    console.log(`✅ KYC Status: ${dummyAdvertiser.kyc_status}`);

  } catch (error) {
    console.error('❌ Error creating dummy advertiser:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDummyAdvertiser()
  .then(() => {
    console.log('🎉 Dummy advertiser seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });