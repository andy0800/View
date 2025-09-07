// backend/scripts/createAdvertiserAccount.js
const { sequelize, User, Wallet } = require('../src/models');
const { filsToKwd, formatKWD } = require('../src/utils/currencyUtils');

async function createAdvertiserAccount() {
  try {
    console.log('🏢 Creating advertiser account with 1,000,000 KWD credit...');
    
    // Create the advertiser user
    const advertiserUser = await User.create({
      name: 'Demo Advertiser', // Required field
      username: 'advertiser_demo',
      email: 'advertiser@demo.com',
      phone: '+96592209794', // Different phone number to avoid conflicts
      role: 'advertiser',
      kyc_status: 'verified',
      is_active: true,
      password: 'demo123456' // You can change this
    });
    
    console.log(`✅ Advertiser user created: ${advertiserUser.username} (ID: ${advertiserUser.id})`);
    
    // Create advertiser profile with correct field names
    const advertiserProfile = await Advertiser.create({
      name: 'Demo Advertiser', // Required field
      phone: '+96592209794', // Required field - same as user
      company_name: 'Demo Advertiser Company',
      license_number: 'DEMO123456', // Required field
      signatory_name: 'Demo Signatory', // Required field
      license_doc: 'demo_license.pdf', // Optional field
      role: 'advertiser',
      kyc_status: 'verified'
    });
    
    console.log(`✅ Advertiser profile created: ${advertiserProfile.company_name}`);
    
    // Create wallet with 1,000,000 KWD credit (convert to fils: 1,000,000 * 1000 = 1,000,000,000 fils)
    const wallet = await Wallet.create({
      user_id: advertiserUser.id,
      balance: 1000000000, // 1,000,000 KWD in fils
      confirmed_points: 1000000000,
      pending_points: 0
    });
    
    console.log(`✅ Advertiser wallet created with ${formatKWD(wallet.balance)} credit`);
    console.log(`💰 Balance in KWD: ${formatKWD(wallet.balance)}`);
    console.log(`💰 Balance in fils: ${wallet.balance}`);
    console.log(`💰 Balance in KWD: ${formatKWD(wallet.balance)}`);
    
    console.log('\n🎉 Advertiser account created successfully!');
    console.log('\n📋 Account Details:');
    console.log(`  👤 Name: ${advertiserUser.name}`);
    console.log(`  👤 Username: ${advertiserUser.username}`);
    console.log(`  📧 Email: ${advertiserUser.email}`);
    console.log(`  📱 Phone: ${advertiserUser.phone}`);
    console.log(`  🏢 Company: ${advertiserProfile.company_name}`);
    console.log(`  💰 Credit: ${(wallet.balance / 1000).toFixed(3)} KWD`);
    console.log(`  🔑 Password: demo123456`);
    console.log(`  ✅ Status: Verified & Active`);
    
    console.log('\n🚀 You can now:');
    console.log('  1. Login with username: advertiser_demo, password: demo123456');
    console.log('  2. Access the advertiser interface');
    console.log('  3. Purchase ad packages with your 1,000,000 KWD credit');
    console.log('  4. Upload and activate ads');
    
  } catch (error) {
    console.error('❌ Error creating advertiser account:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the creation
createAdvertiserAccount();
