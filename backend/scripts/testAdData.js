const { Ad, AdvertiserPackage, PurchasedPackage, User, ViewEvent } = require('../src/models');

async function testAdData() {
  try {
    console.log('Testing ad data...');
    
    const ads = await Ad.count();
    console.log('Total ads:', ads);
    
    const packages = await AdvertiserPackage.count();
    console.log('Total packages:', packages);
    
    const purchasedPackages = await PurchasedPackage.count();
    console.log('Total purchased packages:', purchasedPackages);
    
    const viewEvents = await ViewEvent.count();
    console.log('Total view events:', viewEvents);
    
    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testAdData();
