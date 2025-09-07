// test-advertiser-registration.js
// Test script to verify advertiser registration works without civil ID

const axios = require('axios');

const testAdvertiserRegistration = async () => {
  try {
    console.log('🧪 Testing Advertiser Registration...');
    
    // Test data for advertiser registration
    const formData = new FormData();
    formData.append('phone', '+965501234567');
    formData.append('fullName', 'Test Advertiser');
    formData.append('userType', 'advertiser');
    formData.append('companyName', 'Test Company Ltd');
    formData.append('licenseNumber', 'LIC123456');
    formData.append('commercialRegistrationNumber', 'CR789012');
    formData.append('signatoryName', 'John Doe');
    
    // Create a dummy file for license document
    const dummyFile = new File(['dummy content'], 'license.pdf', { type: 'application/pdf' });
    formData.append('licenseDocument', dummyFile);
    
    console.log('📤 Sending registration request...');
    console.log('📋 Form data:');
    console.log('  - Phone:', '+965501234567');
    console.log('  - Full Name:', 'Test Advertiser');
    console.log('  - User Type:', 'advertiser');
    console.log('  - Company Name:', 'Test Company Ltd');
    console.log('  - License Number:', 'LIC123456');
    console.log('  - Commercial Registration:', 'CR789012');
    console.log('  - Signatory Name:', 'John Doe');
    console.log('  - Civil ID:', 'NOT INCLUDED (as expected for advertisers)');
    
    const response = await axios.post('http://localhost:5000/auth/register', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.log('❌ Registration failed:');
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Message:', error.response.data.message);
      console.log('  Error:', error.response.data);
    } else {
      console.log('  Error:', error.message);
    }
  }
};

// Run the test
testAdvertiserRegistration();
