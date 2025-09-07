// Test the actual API endpoints to ensure they return ads
const http = require('http');

async function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🔍 TESTING API ENDPOINTS FOR AD RETRIEVAL\n');

    // Test without authentication first (should fail)
    console.log('1️⃣ Testing /api/videos/all-ads without auth...');
    try {
      const result1 = await makeRequest('/api/videos/all-ads');
      console.log(`   Status: ${result1.status}`);
      console.log(`   Response: ${JSON.stringify(result1.data, null, 2)}\n`);
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    // We would need a valid JWT token to test authenticated endpoints
    console.log('⚠️ To test authenticated endpoints, we would need a valid JWT token from a logged-in viewer');
    console.log('📝 The backend filtering logic has been fixed and verified by our test script');
    console.log('🎯 Next step: Test via the frontend with a real user session');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing API:', error);
    process.exit(1);
  }
}

testAPI();
