// Test script to identify P20 and P15 ads issue
const { sequelize, Ad, PurchasedPackage, AdvertiserPackage, User } = require('./src/models');

async function testP20P15Issue() {
  try {
    console.log('🔍 TESTING P20/P15 ADS ISSUE...\n');
    
    // 1. Find the advertiser
    const advertiser = await User.findOne({
      where: { phone: '+96550000000', role: 'advertiser' }
    });
    
    if (!advertiser) {
      console.log('❌ Advertiser not found!');
      return;
    }
    
    console.log(`✅ Advertiser found: ${advertiser.name} (ID: ${advertiser.id})`);
    
    // 2. Get P20 and P15 ads specifically
    const p20Ad = await Ad.findOne({
      where: { 
        advertiserId: advertiser.id,
        title: { [sequelize.Sequelize.Op.like]: '%P20%' }
      },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        include: [{
          model: AdvertiserPackage,
          as: 'package'
        }]
      }]
    });
    
    const p15Ad = await Ad.findOne({
      where: { 
        advertiserId: advertiser.id,
        title: { [sequelize.Sequelize.Op.like]: '%P15%' }
      },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        include: [{
          model: AdvertiserPackage,
          as: 'package'
        }]
      }]
    });
    
    console.log('\n📺 P20 AD TEST:');
    if (p20Ad) {
      console.log(`  - Title: ${p20Ad.title}`);
      console.log(`  - Status: ${p20Ad.status}`);
      console.log(`  - Has purchasedPackage: ${!!p20Ad.purchasedPackage}`);
      console.log(`  - Has package: ${!!(p20Ad.purchasedPackage && p20Ad.purchasedPackage.package)}`);
      
      if (p20Ad.purchasedPackage && p20Ad.purchasedPackage.package) {
        console.log(`  - Package name: ${p20Ad.purchasedPackage.package.name}`);
        console.log(`  - Package duration: ${p20Ad.purchasedPackage.package.duration}`);
        console.log(`  - Package price: ${p20Ad.purchasedPackage.package.price_per_view_micro} micro units`);
        
        // Test the method that's failing
        try {
          const pricePerView = p20Ad.getPackagePricePerViewMicro();
          console.log(`  - getPackagePricePerViewMicro(): ${pricePerView} ✅`);
          
          // Test reward calculation
          const viewerShare = p20Ad.purchasedPackage.package.getViewerRewardMicro();
          const companyShare = p20Ad.purchasedPackage.package.getCompanyShareMicro();
          console.log(`  - Viewer share: ${viewerShare} micro units`);
          console.log(`  - Company share: ${companyShare} micro units`);
          
        } catch (error) {
          console.log(`  - ❌ getPackagePricePerViewMicro() failed: ${error.message}`);
        }
      }
    } else {
      console.log('  - ❌ P20 ad not found');
    }
    
    console.log('\n📺 P15 AD TEST:');
    if (p15Ad) {
      console.log(`  - Title: ${p15Ad.title}`);
      console.log(`  - Status: ${p15Ad.status}`);
      console.log(`  - Has purchasedPackage: ${!!p15Ad.purchasedPackage}`);
      console.log(`  - Has package: ${!!(p15Ad.purchasedPackage && p15Ad.purchasedPackage.package)}`);
      
      if (p15Ad.purchasedPackage && p15Ad.purchasedPackage.package) {
        console.log(`  - Package name: ${p15Ad.purchasedPackage.package.name}`);
        console.log(`  - Package duration: ${p15Ad.purchasedPackage.package.duration}`);
        console.log(`  - Package price: ${p15Ad.purchasedPackage.package.price_per_view_micro} micro units`);
        
        // Test the method that's failing
        try {
          const pricePerView = p15Ad.getPackagePricePerViewMicro();
          console.log(`  - getPackagePricePerViewMicro(): ${pricePerView} ✅`);
          
          // Test reward calculation
          const viewerShare = p15Ad.purchasedPackage.package.getViewerRewardMicro();
          const companyShare = p15Ad.purchasedPackage.package.getCompanyShareMicro();
          console.log(`  - Viewer share: ${viewerShare} micro units`);
          console.log(`  - Company share: ${companyShare} micro units`);
          
        } catch (error) {
          console.log(`  - ❌ getPackagePricePerViewMicro() failed: ${error.message}`);
        }
      }
    } else {
      console.log('  - ❌ P15 ad not found');
    }
    
    // 3. Compare with working P10 ad
    console.log('\n📺 P10 AD COMPARISON (Working):');
    const p10Ad = await Ad.findOne({
      where: { 
        advertiserId: advertiser.id,
        title: { [sequelize.Sequelize.Op.like]: '%P10%' }
      },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        include: [{
          model: AdvertiserPackage,
          as: 'package'
        }]
      }]
    });
    
    if (p10Ad) {
      console.log(`  - Title: ${p10Ad.title}`);
      console.log(`  - Has purchasedPackage: ${!!p10Ad.purchasedPackage}`);
      console.log(`  - Has package: ${!!(p10Ad.purchasedPackage && p10Ad.purchasedPackage.package)}`);
      
      if (p10Ad.purchasedPackage && p10Ad.purchasedPackage.package) {
        console.log(`  - Package name: ${p10Ad.purchasedPackage.package.name}`);
        console.log(`  - Package price: ${p10Ad.purchasedPackage.package.price_per_view_micro} micro units`);
        
        try {
          const pricePerView = p10Ad.getPackagePricePerViewMicro();
          console.log(`  - getPackagePricePerViewMicro(): ${pricePerView} ✅`);
        } catch (error) {
          console.log(`  - ❌ getPackagePricePerViewMicro() failed: ${error.message}`);
        }
      }
    }
    
    // 4. Test the exact query used in videoController
    console.log('\n🔍 TESTING EXACT QUERY FROM videoController:');
    const testAd = await Ad.getAdWithPackageDetails(p20Ad.id);
    
    if (testAd) {
      console.log(`  - Loaded via getAdWithPackageDetails: ${testAd.title}`);
      console.log(`  - Has purchasedPackage: ${!!testAd.purchasedPackage}`);
      console.log(`  - Has package: ${!!(testAd.purchasedPackage && testAd.purchasedPackage.package)}`);
      
      if (testAd.purchasedPackage && testAd.purchasedPackage.package) {
        console.log(`  - Package name: ${testAd.purchasedPackage.package.name}`);
        console.log(`  - Package price: ${testAd.purchasedPackage.package.price_per_view_micro} micro units`);
        
        try {
          const pricePerView = testAd.getPackagePricePerViewMicro();
          console.log(`  - getPackagePricePerViewMicro(): ${pricePerView} ✅`);
        } catch (error) {
          console.log(`  - ❌ getPackagePricePerViewMicro() failed: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await sequelize.close();
  }
}

testP20P15Issue();
