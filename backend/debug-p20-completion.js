#!/usr/bin/env node
// Debug script to test P20 video completion flow

const { sequelize, Ad, PurchasedPackage, AdvertiserPackage, User, ViewEvent } = require('./src/models');

async function debugP20Completion() {
  try {
    console.log('🔍 Debugging P20 video completion flow...\n');
    
    // Find advertiser +96550000000
    const advertiser = await User.findOne({ where: { phone: '+96550000000' } });
    if (!advertiser) {
      console.log('❌ Advertiser +96550000000 not found');
      return;
    }
    
    console.log(`✅ Found advertiser: ${advertiser.name} (ID: ${advertiser.id})\n`);
    
    // Find P20 ad
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
    
    if (!p20Ad) {
      console.log('❌ P20 ad not found');
      return;
    }
    
    console.log(`📺 Found P20 ad: ${p20Ad.title}`);
    console.log(`   ID: ${p20Ad.id}`);
    console.log(`   Status: ${p20Ad.status}`);
    console.log(`   Verification: ${p20Ad.verification_status}`);
    console.log(`   Package: ${p20Ad.purchasedPackage.package.name}`);
    console.log(`   Duration: ${p20Ad.purchasedPackage.package.duration}s`);
    console.log(`   Price per view: ${p20Ad.purchasedPackage.package.price_per_view_micro} micro units`);
    console.log(`   Remaining budget: ${p20Ad.purchasedPackage.remaining_micro} micro units\n`);
    
    // Test all the validation steps that completeWatchingAd uses
    console.log('🧪 Testing validation steps:\n');
    
    // 1. Test canAffordView
    try {
      const canAfford = p20Ad.canAffordView();
      console.log(`1. canAffordView(): ${canAfford ? '✅ TRUE' : '❌ FALSE'}`);
    } catch (error) {
      console.log(`1. ❌ canAffordView() failed: ${error.message}`);
    }
    
    // 2. Test package methods
    try {
      const pricePerView = p20Ad.getPackagePricePerViewMicro();
      console.log(`2. getPackagePricePerViewMicro(): ${pricePerView} ✅`);
    } catch (error) {
      console.log(`2. ❌ getPackagePricePerViewMicro() failed: ${error.message}`);
    }
    
    // 3. Test fraud detection with a real user ID
    try {
      // Find a real viewer user
      const viewer = await User.findOne({ where: { role: 'viewer' } });
      if (viewer) {
        const fraudPatterns = await ViewEvent.detectFraudPatterns(viewer.id, p20Ad.id);
        console.log(`3. Fraud detection: ${JSON.stringify(fraudPatterns)} ✅`);
        
        // Check if any fraud is detected
        if (fraudPatterns.multipleViewsSameAd || fraudPatterns.rapidViews || fraudPatterns.ipAnomaly || fraudPatterns.uaAnomaly) {
          console.log(`   ⚠️  Fraud detected! This would cause 400 error.`);
        } else {
          console.log(`   ✅ No fraud detected.`);
        }
      } else {
        console.log(`3. ❌ No viewer user found for fraud detection test`);
      }
    } catch (error) {
      console.log(`3. ❌ Fraud detection failed: ${error.message}`);
    }
    
    // 4. Test the Ad.getAdWithPackageDetails method
    try {
      const loadedAd = await Ad.getAdWithPackageDetails(p20Ad.id);
      console.log(`4. getAdWithPackageDetails(): ✅ SUCCESS`);
      console.log(`   Has PurchasedPackage: ${!!loadedAd.purchasedPackage}`);
      console.log(`   Has Package: ${!!(loadedAd.purchasedPackage && loadedAd.purchasedPackage.package)}`);
      
      if (loadedAd.purchasedPackage && loadedAd.purchasedPackage.package) {
        console.log(`   Package Name: ${loadedAd.purchasedPackage.package.name}`);
        
        // Test the methods that completeWatchingAd uses
        try {
          const pricePerView = loadedAd.getPackagePricePerViewMicro();
          console.log(`   getPackagePricePerViewMicro(): ${pricePerView} ✅`);
        } catch (error) {
          console.log(`   ❌ getPackagePricePerViewMicro() failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`4. ❌ getAdWithPackageDetails failed: ${error.message}`);
    }
    
    // 5. Test if there are any existing ViewEvents for this ad
    try {
      const existingViews = await ViewEvent.findAll({
        where: { ad_id: p20Ad.id },
        attributes: ['id', 'user_id', 'is_completed', 'completed_at']
      });
      console.log(`5. Existing ViewEvents: ${existingViews.length} found`);
      
      if (existingViews.length > 0) {
        existingViews.forEach((view, index) => {
          console.log(`   View ${index + 1}: User ${view.user_id}, Completed: ${view.is_completed}, At: ${view.completed_at}`);
        });
      }
    } catch (error) {
      console.log(`5. ❌ Error checking ViewEvents: ${error.message}`);
    }
    
    console.log('\n🔍 Summary:');
    console.log('If any step above shows ❌, that would cause the 400 error.');
    console.log('Check the backend console for the exact error message during video completion.');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await sequelize.close();
  }
}

debugP20Completion();
