require('dotenv').config();
const axios = require('axios');

async function debugApiCall() {
  try {
    console.log('🧪 Debugging API call...');

    // Test with a specific viewer
    const testViewerPhone = '+96550010003';
    
    console.log(`\n🔐 Logging in viewer: ${testViewerPhone}`);
    
    // Request OTP
    const otpRequest = await axios.post('http://localhost:4001/auth/request-otp', {
      phone: testViewerPhone
    });
    
    if (otpRequest.status !== 200) {
      console.log('❌ Failed to request OTP');
      return;
    }
    
    console.log('✅ OTP requested successfully');
    
    // Verify OTP (using test OTP)
    const verifyResponse = await axios.post('http://localhost:4001/auth/verify-otp', {
      phone: testViewerPhone,
      otp: '1234'
    }, {
      withCredentials: true
    });
    
    if (verifyResponse.status !== 200) {
      console.log('❌ Failed to verify OTP');
      console.log('Response:', verifyResponse.data);
      return;
    }
    
    console.log('✅ OTP verified successfully');
    
    // Get the session cookie
    const cookies = verifyResponse.headers['set-cookie'];
    if (!cookies || cookies.length === 0) {
      console.log('❌ No session cookie received');
      return;
    }
    
    const sessionCookie = cookies[0];
    console.log('🍪 Session cookie received');
    
    // Now test the exact endpoint that test utils are calling
    console.log('\n🔍 Testing /api/viewer/all-ads endpoint (exact test utils call)...');
    
    const adsResponse = await axios.get('http://localhost:4001/api/viewer/all-ads', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`\n📊 API Response Status: ${adsResponse.status}`);
    
    const responseData = adsResponse.data;
    console.log(`\n📊 Response Data:`);
    console.log(`   Success: ${responseData.success}`);
    console.log(`   Videos Array: ${Array.isArray(responseData.videos)}`);
    console.log(`   Videos Length: ${responseData.videos ? responseData.videos.length : 'undefined'}`);
    
    if (responseData.videos && responseData.videos.length > 0) {
      console.log(`\n📹 First Video Sample:`);
      const firstVideo = responseData.videos[0];
      console.log(`   ID: ${firstVideo.id}`);
      console.log(`   Title: ${firstVideo.title}`);
      console.log(`   Media URL: ${firstVideo.mediaUrl}`);
    }
    
    // Now let's test what the test utils would see
    console.log('\n🔍 Testing what test utils would see...');
    
    // Simulate the test utils response structure
    const testUtilsResponse = {
      success: responseData.success,
      data: responseData,
      responseTime: 0
    };
    
    console.log(`\n📊 Test Utils Response Structure:`);
    console.log(`   Success: ${testUtilsResponse.success}`);
    console.log(`   Data Type: ${typeof testUtilsResponse.data}`);
    console.log(`   Data Keys: ${Object.keys(testUtilsResponse.data)}`);
    
    if (testUtilsResponse.data.videos) {
      console.log(`   Videos Length: ${testUtilsResponse.data.videos.length}`);
    }
    
    // Check if this would pass the test utils validation
    if (testUtilsResponse.success && testUtilsResponse.data && testUtilsResponse.data.videos && testUtilsResponse.data.videos.length > 0) {
      console.log('\n✅ This response would PASS test utils validation');
    } else {
      console.log('\n❌ This response would FAIL test utils validation');
      
      if (!testUtilsResponse.success) console.log('   - success is false');
      if (!testUtilsResponse.data) console.log('   - data is missing');
      if (!testUtilsResponse.data.videos) console.log('   - videos array is missing');
      if (testUtilsResponse.data.videos && testUtilsResponse.data.videos.length === 0) console.log('   - videos array is empty');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

debugApiCall();
