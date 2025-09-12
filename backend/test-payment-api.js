const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testPaymentAPI() {
  console.log('🧪 Testing MYFATOORH Payment API...\n');

  try {
    // Step 1: Create Payment Session
    console.log('1️⃣ Creating payment session...');
    const sessionResponse = await axios.post(`${API_BASE_URL}/api/payment/myfatoorah/create-session`, {
      amountKWD: 10,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerMobile: '+96512345678'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment session created:', sessionResponse.data);
    const sessionId = sessionResponse.data.sessionId;

    // Step 2: Simulate Payment
    console.log('\n2️⃣ Simulating payment...');
    const simulationResponse = await axios.post(`${API_BASE_URL}/api/payment/myfatoorah/simulate`, {
      sessionId: sessionId,
      amount: 10
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment simulation result:', simulationResponse.data);

    // Step 3: Verify Payment Status
    console.log('\n3️⃣ Verifying payment status...');
    const verificationResponse = await axios.get(`${API_BASE_URL}/api/payment/myfatoorah/verify/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });

    console.log('✅ Payment verification result:', verificationResponse.data);

    // Step 4: Check Wallet Balance
    console.log('\n4️⃣ Checking wallet balance...');
    const walletResponse = await axios.get(`${API_BASE_URL}/api/advertiser/credit`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });

    console.log('✅ Wallet balance:', walletResponse.data);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPaymentAPI();
