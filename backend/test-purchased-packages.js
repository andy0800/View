// Test script for purchased packages endpoint
const { PurchasedPackage, AdvertiserPackage } = require('./src/models');

async function testPurchasedPackages() {
  try {
    console.log('🔍 Testing purchased packages functionality...');
    
    // Test 1: Check if models are loaded
    console.log('✅ PurchasedPackage model:', !!PurchasedPackage);
    console.log('✅ AdvertiserPackage model:', !!AdvertiserPackage);
    
    // Test 2: Check if getActiveByAdvertiser method exists
    console.log('✅ getActiveByAdvertiser method:', typeof PurchasedPackage.getActiveByAdvertiser);
    
    // Test 3: Try to call the method with a test UUID
    const testAdvertiserId = '00000000-0000-0000-0000-000000000001';
    console.log('🔍 Testing with advertiser ID:', testAdvertiserId);
    
    const packages = await PurchasedPackage.getActiveByAdvertiser(testAdvertiserId);
    console.log('✅ Method executed successfully, found packages:', packages.length);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPurchasedPackages();
