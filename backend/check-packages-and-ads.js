// Check packages and ads for advertiser +96550000000
const { sequelize, AdvertiserPackage, Ad, PurchasedPackage, User } = require('./src/models');

async function checkPackagesAndAds() {
  try {
    console.log('🔍 INVESTIGATING P20/P15 ADS ISSUE...\n');
    
    // 1. Check all available packages
    console.log('📦 STEP 1: Checking all advertiser packages...');
    const packages = await AdvertiserPackage.findAll({ raw: true });
    console.log('Available packages:');
    packages.forEach(pkg => {
      console.log(`  - ID: ${pkg.id}, Name: ${pkg.name}, Duration: ${pkg.duration}s, Price: ${pkg.price_per_view_micro} micro units (${(pkg.price_per_view_micro / 1000000).toFixed(6)} KWD)`);
    });
    
    // 2. Find the advertiser
    console.log('\n👤 STEP 2: Finding advertiser +96550000000...');
    const advertiser = await User.findOne({
      where: { phone: '+96550000000', role: 'advertiser' },
      raw: true
    });
    
    if (!advertiser) {
      console.log('❌ Advertiser not found!');
      return;
    }
    
    console.log(`✅ Advertiser found: ID ${advertiser.id}, Name: ${advertiser.name}`);
    
    // 3. Check purchased packages
    console.log('\n💳 STEP 3: Checking purchased packages...');
    const purchasedPackages = await PurchasedPackage.findAll({
      where: { advertiser_id: advertiser.id },
      include: [{
        model: AdvertiserPackage,
        as: 'package',
        attributes: ['id', 'name', 'duration', 'price_per_view_micro']
      }],
      raw: true,
      nest: true
    });
    
    console.log(`Found ${purchasedPackages.length} purchased packages:`);
    purchasedPackages.forEach(pp => {
      const pkg = pp.package;
      console.log(`  - Package: ${pkg.name} (${pkg.duration}s), Price: ${pkg.price_per_view_micro} micro units`);
      console.log(`    Budget: ${pp.budget_micro} micro units, Remaining: ${pp.remaining_micro} micro units`);
      console.log(`    Status: ${pp.status}, Views: ${pp.views_completed}/${pp.estimated_views}`);
    });
    
    // 4. Check ads
    console.log('\n📺 STEP 4: Checking ads...');
    const ads = await Ad.findAll({
      where: { advertiserId: advertiser.id },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        include: [{
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view_micro']
        }]
      }],
      raw: true,
      nest: true
    });
    
    console.log(`Found ${ads.length} ads:`);
    ads.forEach(ad => {
      const pkg = ad.purchasedPackage.package;
      console.log(`  - Ad: ${ad.title} (ID: ${ad.id})`);
      console.log(`    Package: ${pkg.name} (${pkg.duration}s), Price: ${pkg.price_per_view_micro} micro units`);
      console.log(`    Status: ${ad.status}, Verification: ${ad.verification_status}, Active: ${ad.is_active}`);
      console.log(`    Purchased Package ID: ${ad.purchased_package_id}`);
      console.log(`    Remaining Budget: ${ad.purchasedPackage.remaining_micro} micro units`);
    });
    
    // 5. Check for specific P20 and P15 issues
    console.log('\n🚨 STEP 5: Analyzing P20 and P15 specific issues...');
    const p20Ads = ads.filter(ad => ad.purchasedPackage.package.duration === 20);
    const p15Ads = ads.filter(ad => ad.purchasedPackage.package.duration === 15);
    
    console.log(`P20 ads found: ${p20Ads.length}`);
    p20Ads.forEach(ad => {
      console.log(`  - P20 Ad: ${ad.title}, Status: ${ad.status}, Budget: ${ad.purchasedPackage.remaining_micro} micro units`);
    });
    
    console.log(`P15 ads found: ${p15Ads.length}`);
    p15Ads.forEach(ad => {
      console.log(`  - P15 Ad: ${ad.title}, Status: ${ad.status}, Budget: ${ad.purchasedPackage.remaining_micro} micro units`);
    });
    
    // 6. Check package associations
    console.log('\n🔗 STEP 6: Checking package associations...');
    for (const ad of ads) {
      console.log(`\nAd: ${ad.title}`);
      console.log(`  - Has purchasedPackage: ${!!ad.purchasedPackage}`);
      console.log(`  - Has package: ${!!(ad.purchasedPackage && ad.purchasedPackage.package)}`);
      if (ad.purchasedPackage && ad.purchasedPackage.package) {
        console.log(`  - Package name: ${ad.purchasedPackage.package.name}`);
        console.log(`  - Package duration: ${ad.purchasedPackage.package.duration}`);
        console.log(`  - Package price: ${ad.purchasedPackage.package.price_per_view_micro} micro units`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await sequelize.close();
  }
}

checkPackagesAndAds();
