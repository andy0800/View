const { 
  User, 
  Wallet, 
  Transaction, 
  AdvertiserPackage,
  PurchasedPackage,
  Ad,
  Section,
  sequelize
} = require('../src/models');

async function testAdvertiserInterface() {
  console.log('🔍 TESTING ADVERTISER INTERFACE DATA FLOW\n');
  
  try {
    // Test 1: Check if sections exist and are properly configured
    console.log('1️⃣ Testing Sections Data...');
    const sections = await Section.findAll({ 
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });
    
    if (sections.length === 0) {
      console.log('❌ No active sections found in database');
    } else {
      console.log(`✅ Found ${sections.length} active sections:`);
      sections.forEach(section => {
        console.log(`   - ${section.key}: ${section.title} (${section.ad_count} ads)`);
      });
    }
    
    // Test 2: Check advertiser packages
    console.log('\n2️⃣ Testing Advertiser Packages...');
    const packages = await AdvertiserPackage.findAll({
      where: { is_active: true },
      order: [['duration', 'ASC']]
    });
    
    if (packages.length === 0) {
      console.log('❌ No active advertiser packages found');
    } else {
      console.log(`✅ Found ${packages.length} active packages:`);
      packages.forEach(pkg => {
        console.log(`   - ${pkg.name}: ${pkg.duration}s, ${pkg.price_per_view} fils/view, Min: ${pkg.min_budget} KWD`);
      });
    }
    
    // Test 3: Check purchased packages
    console.log('\n3️⃣ Testing Purchased Packages...');
    const purchasedPackages = await PurchasedPackage.findAll({
      where: { 
        status: 'active',
        is_active: true,
        remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 }
      },
      include: [
        {
          model: AdvertiserPackage,
          as: 'package'
        },
        {
          model: Ad,
          as: 'ads'
        }
      ]
    });
    
    if (purchasedPackages.length === 0) {
      console.log('❌ No active purchased packages found');
    } else {
      console.log(`✅ Found ${purchasedPackages.length} active purchased packages:`);
      purchasedPackages.forEach(pp => {
        console.log(`   - Package: ${pp.package.name}, Budget: ${pp.purchased_budget} KWD, Remaining: ${pp.remaining_budget} KWD, Ads: ${pp.ads.length}`);
      });
    }
    
    // Test 4: Check ads data
    console.log('\n4️⃣ Testing Ads Data...');
    const ads = await Ad.findAll({
      include: [
        {
          model: AdvertiserPackage,
          as: 'package'
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage'
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    if (ads.length === 0) {
      console.log('❌ No ads found in database');
    } else {
      console.log(`✅ Found ${ads.length} ads:`);
      ads.forEach(ad => {
        console.log(`   - ${ad.title}: Status: ${ad.status}, Verification: ${ad.verification_status}, Budget: ${ad.budget} KWD, Section: ${ad.section}`);
        if (ad.purchasedPackage) {
          console.log(`     Purchased Package: ${ad.purchasedPackage.id}, Remaining: ${ad.purchasedPackage.remaining_budget} KWD`);
        }
      });
    }
    
    // Test 5: Check wallet balances
    console.log('\n5️⃣ Testing Wallet Balances...');
    const wallets = await Wallet.findAll();
    
    if (wallets.length === 0) {
      console.log('❌ No wallets found');
    } else {
      console.log(`✅ Found ${wallets.length} wallets:`);
      wallets.forEach(wallet => {
        console.log(`   - User ID: ${wallet.user_id}, Balance: ${wallet.balance} fils (${wallet.balance / 1000} KWD)`);
      });
    }
    
    // Test 6: Check transactions
    console.log('\n6️⃣ Testing Transactions...');
    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    if (transactions.length === 0) {
      console.log('❌ No transactions found');
    } else {
      console.log(`✅ Found ${transactions.length} transactions:`);
      transactions.forEach(tx => {
        console.log(`   - User ID: ${tx.user_id}: ${tx.type} ${tx.amount} fils, Category: ${tx.transaction_category}, Reference: ${tx.reference || 'N/A'}`);
      });
    }
    
    // Test 7: Check data consistency
    console.log('\n7️⃣ Testing Data Consistency...');
    
    // Check if ads have valid sections
    const invalidSectionAds = ads.filter(ad => !sections.find(s => s.key === ad.section));
    if (invalidSectionAds.length > 0) {
      console.log(`❌ Found ${invalidSectionAds.length} ads with invalid sections:`);
      invalidSectionAds.forEach(ad => {
        console.log(`   - Ad ${ad.id}: Invalid section "${ad.section}"`);
      });
    } else {
      console.log('✅ All ads have valid sections');
    }
    
    // Check if ads have valid purchased packages
    const adsWithoutPurchasedPackage = ads.filter(ad => !ad.purchased_package_id);
    if (adsWithoutPurchasedPackage.length > 0) {
      console.log(`❌ Found ${adsWithoutPurchasedPackage.length} ads without purchased packages:`);
      adsWithoutPurchasedPackage.forEach(ad => {
        console.log(`   - Ad ${ad.id}: ${ad.title}`);
      });
    } else {
      console.log('✅ All ads have valid purchased packages');
    }
    
    // Check budget consistency
    let budgetIssues = 0;
    
    // Group ads by purchased package to check total budget allocation
    const packageGroups = {};
    for (const ad of ads) {
      if (ad.purchasedPackage) {
        const packageId = ad.purchasedPackage.id;
        if (!packageGroups[packageId]) {
          packageGroups[packageId] = {
            package: ad.purchasedPackage,
            ads: [],
            totalAdBudget: 0
          };
        }
        packageGroups[packageId].ads.push(ad);
        packageGroups[packageId].totalAdBudget += parseFloat(ad.budget) || 0;
      }
    }
    
    for (const packageId in packageGroups) {
      const group = packageGroups[packageId];
      const packageUsedBudget = parseFloat(group.package.used_budget) || 0;
      const packageRemainingBudget = parseFloat(group.package.remaining_budget) || 0;
      const packageTotalBudget = parseFloat(group.package.purchased_budget) || 0;
      
      const expectedUsedBudget = group.totalAdBudget;
      const expectedRemainingBudget = packageTotalBudget - group.totalAdBudget;
      
      if (Math.abs(packageUsedBudget - expectedUsedBudget) > 0.01 || 
          Math.abs(packageRemainingBudget - expectedRemainingBudget) > 0.01) {
        budgetIssues++;
        if (budgetIssues <= 5) { // Limit output
          console.log(`   - Package ${packageId}: Budget mismatch - Used: ${packageUsedBudget} vs Expected: ${expectedUsedBudget}, Remaining: ${packageRemainingBudget} vs Expected: ${expectedRemainingBudget}`);
          console.log(`     Ads in package: ${group.ads.map(ad => `${ad.title} (${ad.budget} KWD)`).join(', ')}`);
        }
      }
    }
    
    if (budgetIssues === 0) {
      console.log('✅ All ad budgets are consistent with purchased packages');
    } else {
      console.log(`❌ Found ${budgetIssues} budget consistency issues`);
    }
    
    console.log('\n✅ Advertiser Interface Data Flow Test Completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testAdvertiserInterface();
