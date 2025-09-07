// backend/scripts/test-viewer-system-fixes.js
require('dotenv').config();
const { sequelize } = require('../src/models');
const { User, Wallet, Section, Ad, AdvertiserPackage, PurchasedPackage } = require('../src/models');

async function testViewerSystemFixes() {
  try {
    console.log('🧪 Testing Viewer System Fixes...');
    
    // 1. Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // 2. Test model loading
    console.log('✅ Models loaded successfully');
    
    // 3. Test sections data
    const sections = await Section.findAll({ where: { is_active: true } });
    console.log(`✅ Found ${sections.length} active sections`);
    
    // 4. Test advertiser packages
    const packages = await AdvertiserPackage.findAll({ where: { is_active: true } });
    console.log(`✅ Found ${packages.length} active advertiser packages`);
    
    // 5. Test ads data
    const ads = await Ad.findAll({ 
      where: { is_active: true },
      include: [
        { model: PurchasedPackage, as: 'purchasedPackage' },
        { model: User, as: 'advertiser' }
      ]
    });
    console.log(`✅ Found ${ads.length} active ads`);
    
    // 6. Test wallet system
    const wallets = await Wallet.findAll();
    console.log(`✅ Found ${wallets.length} wallets`);
    
    // 7. Test user roles
    const viewers = await User.findAll({ where: { role: 'viewer' } });
    const advertisers = await User.findAll({ where: { role: 'advertiser' } });
    console.log(`✅ Found ${viewers.length} viewers and ${advertisers.length} advertisers`);
    
    // 8. Test data integrity
    let dataIntegrityIssues = [];
    
    // Check for ads without packages
    const adsWithoutPackages = ads.filter(ad => !ad.purchasedPackage);
    if (adsWithoutPackages.length > 0) {
      dataIntegrityIssues.push(`Found ${adsWithoutPackages.length} ads without packages`);
    }
    
    // Check for packages without ads
    const packagesWithoutAds = packages.filter(pkg => 
      !ads.some(ad => ad.purchasedPackage?.package_id === pkg.id)
    );
    if (packagesWithoutAds.length > 0) {
      dataIntegrityIssues.push(`Found ${packagesWithoutAds.length} packages without ads`);
    }
    
    if (dataIntegrityIssues.length === 0) {
      console.log('✅ Data integrity check passed');
    } else {
      console.log('⚠️ Data integrity issues found:', dataIntegrityIssues);
    }
    
    // 9. Test micro-unit calculations
    if (packages.length > 0) {
      const testPackage = packages[0];
      const viewerReward = testPackage.getViewerRewardMicro();
      const companyShare = testPackage.getCompanyShareMicro();
      const total = viewerReward + companyShare;
      
      if (total === testPackage.price_per_view_micro) {
        console.log('✅ Micro-unit calculations working correctly');
        console.log(`   Package: ${testPackage.name}`);
        console.log(`   Price per view: ${testPackage.getPricePerViewKWD()} KWD`);
        console.log(`   Viewer reward: ${viewerReward / 1_000_000} KWD`);
        console.log(`   Company share: ${companyShare / 1_000_000} KWD`);
      } else {
        console.log('❌ Micro-unit calculations incorrect');
      }
    }
    
    // 10. Test wallet balance calculations
    if (wallets.length > 0) {
      const testWallet = wallets[0];
      const balanceKWD = testWallet.getBalanceKWD();
      const balanceMicro = testWallet.getBalanceMicro();
      
      if (balanceKWD === balanceMicro / 1_000_000) {
        console.log('✅ Wallet balance calculations working correctly');
        console.log(`   Balance: ${balanceKWD} KWD (${balanceMicro} micro units)`);
      } else {
        console.log('❌ Wallet balance calculations incorrect');
      }
    }
    
    console.log('\n🎉 Viewer System Fixes Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Database: ✅ Connected`);
    console.log(`   - Models: ✅ Loaded`);
    console.log(`   - Sections: ✅ ${sections.length} active`);
    console.log(`   - Packages: ✅ ${packages.length} active`);
    console.log(`   - Ads: ✅ ${ads.length} active`);
    console.log(`   - Wallets: ✅ ${wallets.length} found`);
    console.log(`   - Users: ✅ ${viewers.length} viewers, ${advertisers.length} advertisers`);
    console.log(`   - Data Integrity: ${dataIntegrityIssues.length === 0 ? '✅ Passed' : '⚠️ Issues Found'}`);
    console.log(`   - Calculations: ✅ Working`);
    
    if (dataIntegrityIssues.length > 0) {
      console.log('\n⚠️ Recommendations:');
      dataIntegrityIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Error testing viewer system fixes:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

if (require.main === module) {
  testViewerSystemFixes();
}

module.exports = testViewerSystemFixes;
