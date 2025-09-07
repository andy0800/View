// Script to create missing test data for video watching system
const { User, Wallet, CompanyWallet, sequelize } = require('../src/models');

async function createTestData() {
  try {
    console.log('🆕 CREATING MISSING TEST DATA');
    console.log('=' .repeat(60));
    
    // 1. Create company wallet if it doesn't exist
    console.log('\n🏢 Creating company wallet...');
    let companyWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });
    
    if (!companyWallet) {
      companyWallet = await CompanyWallet.create({
        company_name: 'View App Company',
        balance: 0, // Start with 0 balance
        total_earnings: 0,
        total_video_views: 0,
        total_company_fees: 0,
        total_viewer_rewards: 0,
        total_ad_spending: 0
      });
      console.log('✅ Created company wallet');
    } else {
      console.log('✅ Company wallet already exists');
    }
    
    console.log(`Company Wallet ID: ${companyWallet.id}`);
    console.log(`Balance: ${companyWallet.balance} fils (${companyWallet.balance / 1000} KWD)`);
    
    // 2. Create test viewer if it doesn't exist
    console.log('\n👤 Creating test viewer...');
    let testViewer = await User.findOne({
      where: { phone: '+96560000000', role: 'viewer' }
    });
    
    if (!testViewer) {
      testViewer = await User.create({
        name: 'Test Viewer',
        phone: '+96560000000',
        email: 'viewer@test.com',
        role: 'viewer',
        kyc_status: 'verified',
        verified_at: new Date(),
        verified_by: null, // System-created user, no admin verification
        is_active: true,
        civil_id: '123456789012' // 12 digits for viewers
      });
      console.log('✅ Created test viewer');
    } else {
      console.log('✅ Test viewer already exists');
    }
    
    console.log(`Viewer ID: ${testViewer.id}`);
    console.log(`Name: ${testViewer.name}`);
    console.log(`Phone: ${testViewer.phone}`);
    
    // 3. Create viewer wallet if it doesn't exist
    console.log('\n💰 Creating viewer wallet...');
    let viewerWallet = await Wallet.findOne({
      where: { user_id: testViewer.id }
    });
    
    if (!viewerWallet) {
      viewerWallet = await Wallet.create({
        user_id: testViewer.id,
        balance: 0, // Start with 0 balance
        total_earned: 0,
        total_withdrawn: 0
      });
      console.log('✅ Created viewer wallet');
    } else {
      console.log('✅ Viewer wallet already exists');
    }
    
    console.log(`Viewer Wallet ID: ${viewerWallet.id}`);
    console.log(`Balance: ${viewerWallet.balance} fils (${viewerWallet.balance / 1000} KWD)`);
    
    // 4. Verify all test data
    console.log('\n🔍 Verifying test data...');
    
    const finalCompanyWallet = await CompanyWallet.findByPk(companyWallet.id);
    const finalViewerWallet = await Wallet.findByPk(viewerWallet.id);
    const finalViewer = await User.findByPk(testViewer.id);
    
    console.log('\n📊 FINAL TEST DATA STATUS:');
    console.log('=' .repeat(40));
    console.log(`🏢 Company Wallet:`);
    console.log(`   ID: ${finalCompanyWallet.id}`);
    console.log(`   Balance: ${finalCompanyWallet.balance} fils (${finalCompanyWallet.balance / 1000} KWD)`);
    console.log(`   Total Earnings: ${finalCompanyWallet.total_earnings} fils (${finalCompanyWallet.total_earnings / 1000} KWD)`);
    
    console.log(`\n👤 Test Viewer:`);
    console.log(`   ID: ${finalViewer.id}`);
    console.log(`   Name: ${finalViewer.name}`);
    console.log(`   Phone: ${finalViewer.phone}`);
    console.log(`   Role: ${finalViewer.role}`);
    console.log(`   KYC Status: ${finalViewer.kyc_status}`);
    
    console.log(`\n💰 Viewer Wallet:`);
    console.log(`   ID: ${finalViewerWallet.id}`);
    console.log(`   Balance: ${finalViewerWallet.balance} fils (${finalViewerWallet.balance / 1000} KWD)`);
    console.log(`   Total Earned: ${finalViewerWallet.total_earned} fils (${finalViewerWallet.total_earned / 1000} KWD)`);
    
    console.log('\n🚀 Test data creation complete!');
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Run video watching system test again`);
    console.log(`2. Test actual video completion via API`);
    console.log(`3. Verify reward distribution works correctly`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestData();
}
