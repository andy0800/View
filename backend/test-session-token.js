require('dotenv').config();
const TestUtils = require('./pressure-test/test-utils');

async function testSessionToken() {
  try {
    console.log('🧪 Testing session token storage and retrieval...');

    const testUtils = new TestUtils();
    
    // Test with a specific viewer
    const testViewerPhone = '+96550010003';
    
    console.log(`\n🔐 Logging in viewer: ${testViewerPhone}`);
    
    // Login
    const loginResult = await testUtils.loginWithOtp(testViewerPhone);
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.error);
      return;
    }
    
    console.log('✅ Login successful');
    
    // Check if token was stored
    const storedToken = testUtils.sessionTokens.get(testViewerPhone);
    if (storedToken) {
      console.log(`✅ Token stored: ${storedToken.substring(0, 20)}...`);
    } else {
      console.log('❌ No token stored');
      return;
    }
    
    // Test getAuthenticatedRequest
    console.log('\n🔍 Testing getAuthenticatedRequest...');
    
    try {
      const authConfig = await testUtils.getAuthenticatedRequest(testViewerPhone);
      console.log('✅ getAuthenticatedRequest successful');
      console.log('Auth config:', JSON.stringify(authConfig, null, 2));
    } catch (error) {
      console.log('❌ getAuthenticatedRequest failed:', error.message);
    }
    
    // Test the actual API call
    console.log('\n🔍 Testing actual API call...');
    
    try {
      const adsResult = await testUtils.getAvailableAds(testViewerPhone);
      console.log('✅ getAvailableAds successful');
      console.log('Result:', JSON.stringify(adsResult, null, 2));
    } catch (error) {
      console.log('❌ getAvailableAds failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSessionToken();
