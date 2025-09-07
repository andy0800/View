// backend/scripts/injectAdmin.js
// Script to inject admin user for OTP-based authentication system

const { User, Wallet } = require('../src/models');

async function injectAdmin() {
  try {
    console.log('🚀 Starting admin injection for OTP system...');
    
    const ADMIN_PHONE = '+96500000000'; // Admin phone number
    const ADMIN_NAME = 'System Administrator';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { 
        phone: ADMIN_PHONE,
        role: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('⚠️ Admin already exists with phone:', ADMIN_PHONE);
      console.log('📊 User ID:', existingAdmin.id);
      console.log('📊 Role:', existingAdmin.role);
      console.log('📊 KYC Status:', existingAdmin.kyc_status);
      
      // Check if wallet exists
      const existingWallet = await Wallet.findOne({
        where: { user_id: existingAdmin.id }
      });

      if (existingWallet) {
        console.log('💰 Wallet exists with balance:', existingWallet.balance);
      } else {
        console.log('❌ No wallet found for existing admin');
      }
      return;
    }

    console.log('🔐 Creating admin user for OTP authentication...');

    // Create admin user (no password needed for OTP system)
    const adminUser = await User.create({
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      role: 'admin',
      kyc_status: 'verified',
      is_active: true,
      verified_at: new Date(),
      verified_by: null, // Self-verified for system admin
      civil_id: null, // Admins don't need civil ID
      company_name: 'System Administration',
      license_number: 'ADMIN001',
      commercial_registration_number: 'ADMIN-CR001',
      signatory_name: 'System Admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📊 User ID:', adminUser.id);
    console.log('📊 Name:', adminUser.name);
    console.log('📊 Phone:', adminUser.phone);
    console.log('📊 Role:', adminUser.role);
    console.log('📊 KYC Status:', adminUser.kyc_status);

    // Create admin wallet with initial balance
    const adminWallet = await Wallet.create({
      user_id: adminUser.id,
      confirmed_points: 0,
      balance: 1000000000, // 1,000,000 KWD in fils
      pending_points: 0
    });

    console.log('💰 Admin wallet created successfully!');
    console.log('📊 Wallet ID:', adminWallet.id);
    console.log('📊 Balance:', (adminWallet.balance / 1000).toLocaleString(), 'KWD');
    console.log('📊 Balance in fils:', adminWallet.balance.toLocaleString());

    // Verify the data was created correctly
    const verifyAdmin = await User.findOne({
      where: { phone: ADMIN_PHONE }
    });

    if (verifyAdmin) {
      console.log('\n🔍 VERIFICATION SUCCESSFUL:');
      console.log('✅ Admin user created and verified');
      console.log('✅ KYC status: verified');
      console.log('✅ Wallet created with 1,000,000 KWD');
      console.log('✅ Phone:', ADMIN_PHONE);
      console.log('✅ Role: admin');
      console.log('✅ Company: System Administration');
    }

    console.log('\n🎉 Admin injection completed successfully!');
    console.log('🔐 You can now login with OTP:');
    console.log('   1. Request OTP to:', ADMIN_PHONE);
    console.log('   2. Enter the OTP code');
    console.log('   3. Access admin dashboard');
    console.log('💰 Wallet balance: 1,000,000 KWD');
    console.log('🔐 KYC Status: Verified');

  } catch (error) {
    console.error('❌ Error injecting admin:', error);
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
  injectAdmin()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { injectAdmin };
