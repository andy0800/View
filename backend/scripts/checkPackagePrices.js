// Check advertiser package prices and budget allocation logic
const { AdvertiserPackage, PurchasedPackage, Ad } = require('../src/models');

async function checkPackagePrices() {
  try {
    console.log('🔍 CHECKING ADVERTISER PACKAGE PRICES\n');

    // Check advertiser packages
    const packages = await AdvertiserPackage.findAll();
    console.log('📦 ADVERTISER PACKAGES:');
    packages.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}, Duration: ${p.duration}s, Price per view: ${p.price_per_view} KWD`);
    });

    console.log('\n🔍 BUDGET CALCULATION ANALYSIS:');
    
    // Test the filtering logic 
    const firstPackage = packages[0];
    if (firstPackage) {
      const pricePerViewFromDB = firstPackage.price_per_view;
      const incorrectConversion = pricePerViewFromDB / 1000; // Current wrong logic
      const correctPrice = pricePerViewFromDB; // Should be this
      
      console.log(`Package: ${firstPackage.name}`);
      console.log(`Price per view from DB: ${pricePerViewFromDB} KWD`);
      console.log(`Current (wrong) conversion: ${pricePerViewFromDB} / 1000 = ${incorrectConversion} KWD`);
      console.log(`Correct price: ${correctPrice} KWD`);
      console.log(`Remaining budget needed to show ad: ${correctPrice} KWD`);
      
      // Check if any purchased package would pass the filter
      const purchasedPackages = await PurchasedPackage.findAll();
      console.log('\n📦 PURCHASED PACKAGE BUDGET CHECKS:');
      purchasedPackages.forEach(p => {
        const passesWrongFilter = p.remaining_budget >= incorrectConversion;
        const passesCorrectFilter = p.remaining_budget >= correctPrice;
        console.log(`Package ${p.id}: ${p.remaining_budget} KWD remaining`);
        console.log(`  - Passes current (wrong) filter: ${passesWrongFilter}`);
        console.log(`  - Would pass correct filter: ${passesCorrectFilter}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking package prices:', error);
    process.exit(1);
  }
}

checkPackagePrices();
