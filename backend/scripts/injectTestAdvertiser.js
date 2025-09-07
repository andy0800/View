// backend/scripts/injectTestAdvertiser.js
// Script to inject a test advertiser with verified KYC and 1,000,000 KWD credit wallet

const { User, Wallet } = require('../src/models');

async function injectTestAdvertiser() {
  try {
    console.log('🚀 Starting test advertiser injection...');

    // Check if test advertiser already exists
    const existingUser = await User.findOne({
      where: { phone: '+96550000000' }
    });

    if (existingUser) {
      console.log('⚠️ Test advertiser already exists with phone +96550000000');
      console.log('📊 User ID:', existingUser.id);
      console.log('📊 Role:', existingUser.role);
      console.log('📊 KYC Status:', existingUser.kyc_status);
      
      // Check if wallet exists
      const existingWallet = await Wallet.findOne({
        where: { user_id: existingUser.id }
      });
      
      if (existingWallet) {
        console.log('💰 Wallet exists with balance:', existingWallet.balance);
        console.log('💡 To update balance, use the update script instead');
      } else {
        console.log('❌ No wallet found for existing user');
      }
      return;
    }

    // Create test advertiser user
    const testAdvertiser = await User.create({
      name: 'Test Advertiser',
      phone: '+96550000000',
      role: 'advertiser',
      kyc_status: 'verified',
      company_name: 'Test Company Ltd',
      license_number: 'TEST123456',
      commercial_registration_number: 'CR789012',
      signatory_name: 'Test Signatory',
      license_doc_key: 'test-license-doc',
      is_active: true,
      verified_at: new Date(),
      verified_by: null, // Self-verified for test
      civil_id: null // Advertisers don't need civil ID
    });

    console.log('✅ Test advertiser created successfully!');
    console.log('📊 User ID:', testAdvertiser.id);
    console.log('📊 Name:', testAdvertiser.name);
    console.log('📊 Phone:', testAdvertiser.phone);
    console.log('📊 Role:', testAdvertiser.role);
    console.log('📊 KYC Status:', testAdvertiser.kyc_status);
    console.log('📊 Company:', testAdvertiser.company_name);

    // Create wallet with 1,000,000 KWD (1,000,000,000 fils)
    const testWallet = await Wallet.create({
      user_id: testAdvertiser.id,
      confirmed_points: 0,
      balance: 1000000000, // 1,000,000 KWD in fils (1 KWD = 1000 fils)
      pending_points: 0
    });

    console.log('💰 Wallet created successfully!');
    console.log('📊 Wallet ID:', testWallet.id);
    console.log('📊 Balance:', (testWallet.balance / 1000).toLocaleString(), 'KWD');
    console.log('📊 Balance in fils:', testWallet.balance.toLocaleString());

    // Verify the data was created correctly
    const verifyUser = await User.findOne({
      where: { phone: '+96550000000' }
    });

    if (verifyUser) {
      console.log('\n🔍 VERIFICATION SUCCESSFUL:');
      console.log('✅ User created and verified');
      console.log('✅ KYC status: verified');
      console.log('✅ Wallet created with 1,000,000 KWD');
      console.log('✅ Phone number: +96550000000');
      console.log('✅ Role: advertiser');
      console.log('✅ Company: Test Company Ltd');
    }

    console.log('\n🎉 Test advertiser injection completed successfully!');
    console.log('📱 You can now login with phone: +96550000000');
    console.log('💰 Wallet balance: 1,000,000 KWD');
    console.log('🔐 KYC Status: Verified');

  } catch (error) {
    console.error('❌ Error injecting test advertiser:', error);
    console.error('📋 Error details:', error.message);
    
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
  }
}

// Run the injection
if (require.main === module) {
  injectTestAdvertiser()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { injectTestAdvertiser };
