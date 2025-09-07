require('dotenv').config();
const axios = require('axios');

async function testApiResponse() {
  try {
    console.log('🧪 Testing API response structure...');

    // First, let's login a test viewer to get a token
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
    
    // Now test the viewer ads endpoint
    console.log('\n🔍 Testing /api/viewer/all-ads endpoint...');
    
    const adsResponse = await axios.get('http://localhost:4001/api/viewer/all-ads', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`\n📊 API Response Status: ${adsResponse.status}`);
    console.log(`📊 Response Headers:`, Object.keys(adsResponse.headers));
    
    const responseData = adsResponse.data;
    console.log(`\n📊 Response Data Structure:`);
    console.log(`   Type: ${typeof responseData}`);
    console.log(`   Keys: ${Object.keys(responseData)}`);
    
    if (responseData.success !== undefined) {
      console.log(`   Success: ${responseData.success}`);
    }
    
    if (responseData.videos !== undefined) {
      console.log(`   Videos Array: ${Array.isArray(responseData.videos)}`);
      console.log(`   Videos Length: ${responseData.videos ? responseData.videos.length : 'undefined'}`);
      
      if (responseData.videos && responseData.videos.length > 0) {
        console.log(`\n📹 First Video Sample:`);
        const firstVideo = responseData.videos[0];
        console.log(`   Keys: ${Object.keys(firstVideo)}`);
        console.log(`   ID: ${firstVideo.id}`);
        console.log(`   Title: ${firstVideo.title}`);
        console.log(`   Media URL: ${firstVideo.mediaUrl}`);
      }
    }
    
    if (responseData.message !== undefined) {
      console.log(`   Message: ${responseData.message}`);
    }
    
    if (responseData.error !== undefined) {
      console.log(`   Error: ${responseData.error}`);
    }
    
    // Log the full response for debugging
    console.log(`\n📄 Full Response Data:`);
    console.log(JSON.stringify(responseData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testApiResponse();
