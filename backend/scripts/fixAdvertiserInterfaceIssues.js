const { 
  Ad, 
  PurchasedPackage, 
  AdvertiserPackage,
  sequelize
} = require('../src/models');

async function fixAdvertiserInterfaceIssues() {
  console.log('🔧 FIXING ADVERTISER INTERFACE ISSUES\n');
  
  try {
    // Fix 1: Fix budget consistency issues
    console.log('1️⃣ Fixing Budget Consistency Issues...');
    
    const ads = await Ad.findAll({
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage'
        }
      ]
    });
    
    let fixedCount = 0;
    for (const ad of ads) {
      if (ad.purchasedPackage) {
        const adBudget = parseFloat(ad.budget) || 0;
        const packageUsedBudget = parseFloat(ad.purchasedPackage.used_budget) || 0;
        const packageRemainingBudget = parseFloat(ad.purchasedPackage.remaining_budget) || 0;
        const packageTotalBudget = parseFloat(ad.purchasedPackage.purchased_budget) || 0;
        
        const expectedUsedBudget = adBudget;
        const expectedRemainingBudget = packageTotalBudget - adBudget;
        
        if (Math.abs(packageUsedBudget - expectedUsedBudget) > 0.01 || 
            Math.abs(packageRemainingBudget - expectedRemainingBudget) > 0.01) {
          
          console.log(`   🔧 Fixing ad ${ad.id}: ${ad.title}`);
          console.log(`      Old - Used: ${packageUsedBudget}, Remaining: ${packageRemainingBudget}`);
          console.log(`      New - Used: ${expectedUsedBudget}, Remaining: ${expectedRemainingBudget}`);
          
          await ad.purchasedPackage.update({
            used_budget: expectedUsedBudget,
            remaining_budget: expectedRemainingBudget,
            status: expectedRemainingBudget <= 0 ? 'used' : 'active'
          });
          
          fixedCount++;
        }
      }
    }
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} budget consistency issues`);
    } else {
      console.log('✅ No budget consistency issues found');
    }
    
    // Fix 2: Update section ad counts
    console.log('\n2️⃣ Updating Section Ad Counts...');
    
    const sections = await sequelize.models.Section.findAll();
    for (const section of sections) {
      const adCount = await Ad.count({
        where: {
          section: section.key,
          status: 'active',
          verification_status: 'approved'
        },
        include: [
          {
            model: PurchasedPackage,
            as: 'purchasedPackage',
            where: {
              remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 },
              status: 'active'
            }
          }
        ]
      });
      
      if (section.ad_count !== adCount) {
        console.log(`   🔧 Updating section ${section.key}: ${section.ad_count} → ${adCount}`);
        await section.update({ ad_count: adCount });
      }
    }
    
    console.log('✅ Section ad counts updated');
    
    // Fix 3: Check for ads with insufficient budget
    console.log('\n3️⃣ Checking Ads with Insufficient Budget...');
    
    const adsWithNoBudget = await Ad.findAll({
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [sequelize.Sequelize.Op.lte]: 0 }
          }
        }
      ]
    });
    
    if (adsWithNoBudget.length > 0) {
      console.log(`⚠️ Found ${adsWithNoBudget.length} ads with insufficient budget:`);
      adsWithNoBudget.forEach(ad => {
        console.log(`   - ${ad.title}: Budget ${ad.budget} KWD, Package Remaining: ${ad.purchasedPackage.remaining_budget} KWD`);
      });
      
      console.log('   💡 These ads will not be shown to viewers until budget is replenished');
    } else {
      console.log('✅ All ads have sufficient budget');
    }
    
    // Fix 4: Validate package price consistency
    console.log('\n4️⃣ Validating Package Price Consistency...');
    
    const packages = await AdvertiserPackage.findAll({
      where: { is_active: true }
    });
    
    for (const pkg of packages) {
      const pricePerView = parseFloat(pkg.price_per_view);
      if (pricePerView <= 0) {
        console.log(`❌ Package ${pkg.name} has invalid price_per_view: ${pricePerView}`);
      } else {
        console.log(`✅ Package ${pkg.name}: ${pricePerView} fils/view`);
      }
    }
    
    console.log('\n✅ Advertiser Interface Issues Fix Completed');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await sequelize.close();
  }
}

fixAdvertiserInterfaceIssues();
