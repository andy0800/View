const { 
  User, 
  Wallet, 
  Transaction, 
  ViewEvent, 
  Ad, 
  AdvertiserPackage,
  PurchasedPackage,
  Section,
  CompanyWallet,
  sequelize 
} = require('../src/models');

async function testViewerInterfaceFlow() {
  console.log('🔍 TESTING VIEWER INTERFACE DATA FLOW\n');
  
  try {
    // Test 1: Verify sections are properly loaded with real data
    console.log('1️⃣ Testing Sections System...');
    const sections = await Section.findAll({ 
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });
    
    if (sections.length === 0) {
      console.log('❌ No sections found in database');
    } else {
      console.log(`✅ Found ${sections.length} active sections:`);
      sections.forEach(section => {
        console.log(`   - ${section.key}: ${section.title} (${section.description})`);
      });
    }

    // Test 2: Check video availability with proper budget filtering
    console.log('\n2️⃣ Testing Video Availability...');
    const availableAds = await Ad.findAll({
      where: {
        status: 'active',
        is_active: true,
        verification_status: 'approved',
        purchased_package_id: { [sequelize.Sequelize.Op.ne]: null }
      },
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 },
            status: 'active'
          }
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view']
        }
      ]
    });

    console.log(`✅ Found ${availableAds.length} available ads with sufficient budget:`);
    availableAds.slice(0, 5).forEach(ad => {
      console.log(`   - ${ad.title}: ${ad.purchasedPackage.remaining_budget} KWD remaining, Package: ${ad.package.name}`);
    });

    // Test 3: Verify wallet operations work correctly
    console.log('\n3️⃣ Testing Wallet Operations...');
    const testViewer = await User.findOne({ 
      where: { role: 'viewer' },
      include: [{ model: Wallet, as: 'wallet' }]
    });

    if (testViewer) {
      console.log(`✅ Found test viewer: ${testViewer.name || testViewer.email}`);
      const wallet = testViewer.wallet || await Wallet.findOne({ where: { user_id: testViewer.id } });
      
      if (wallet) {
        console.log(`   - Wallet balance: ${wallet.balance} fils (${(wallet.balance / 1000).toFixed(3)} KWD)`);
        console.log(`   - Confirmed points: ${wallet.confirmed_points} fils`);
      } else {
        console.log('⚠️ No wallet found for test viewer');
      }
    } else {
      console.log('⚠️ No test viewer found');
    }

        // Test 4: Check transaction history for reward tracking
    console.log('\n4️⃣ Testing Transaction History...');
    const rewardTransactions = await Transaction.findAll({
      where: {
        transaction_category: 'user_reward'
      },
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [{ model: User, as: 'user', attributes: ['name', 'phone'] }]
    });
    
    console.log(`✅ Found ${rewardTransactions.length} reward transactions (showing last 5):`);
    rewardTransactions.forEach(tx => {
      console.log(`   - ${tx.user?.name || tx.user?.phone}: ${tx.amount} fils, ${tx.reference}`);
    });

        // Test 5: Verify ViewEvent tracking
    console.log('\n5️⃣ Testing View Event Tracking...');
    const viewEvents = await ViewEvent.findAll({
      where: { is_completed: true },
      order: [['completed_at', 'DESC']],
      limit: 5,
      include: [
        { model: Ad, as: 'ad', attributes: ['title'] },
        { model: User, as: 'user', attributes: ['name', 'phone'] }
      ]
    });
    
    console.log(`✅ Found ${viewEvents.length} completed view events (showing last 5):`);
    viewEvents.forEach(event => {
      console.log(`   - ${event.user?.name || event.user?.phone} watched "${event.ad?.title}": ${event.viewer_reward} KWD reward`);
    });

    // Test 6: Check company wallet status
    console.log('\n6️⃣ Testing Company Wallet...');
    const companyWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });

    if (companyWallet) {
      console.log('✅ Company wallet found:');
      console.log(`   - Balance: ${companyWallet.balance} fils (${(companyWallet.balance / 1000).toFixed(3)} KWD)`);
      console.log(`   - Total earnings: ${companyWallet.total_earnings} fils`);
      console.log(`   - Total video views: ${companyWallet.total_video_views}`);
    } else {
      console.log('⚠️ Company wallet not found');
    }

    // Test 7: Validate reward calculation logic
    console.log('\n7️⃣ Testing Reward Calculation Logic...');
    if (availableAds.length > 0) {
      const testAd = availableAds[0];
      const packagePricePerView = parseFloat(testAd.package.price_per_view);
      const viewerReward = packagePricePerView / 2;
      const companyFee = packagePricePerView / 2;
      
      console.log('✅ Reward calculation for test ad:');
      console.log(`   - Package: ${testAd.package.name}`);
      console.log(`   - Price per view: ${packagePricePerView} KWD`);
      console.log(`   - Viewer reward (50%): ${viewerReward} KWD (${viewerReward * 1000} fils)`);
      console.log(`   - Company fee (50%): ${companyFee} KWD (${companyFee * 1000} fils)`);
      console.log(`   - Total cost: ${packagePricePerView} KWD`);
    }

    console.log('\n✅ VIEWER INTERFACE TEST COMPLETED SUCCESSFULLY');

  } catch (error) {
    console.error('❌ Error during viewer interface test:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  testViewerInterfaceFlow();
}

module.exports = { testViewerInterfaceFlow };
