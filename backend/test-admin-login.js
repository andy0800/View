// test-admin-login.js
// Test script for admin login endpoint (no external deps)

const http = require('http');

function makeRequest(path, { method = 'GET', data } = {}) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 4001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 8000
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login endpoint...');
    const loginData = {
      username: process.env.ADMIN_USERNAME || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123'
    };
    console.log('📤 Sending login request with:', { username: loginData.username, password: '********' });
    const response = await makeRequest('/auth/admin-login', { method: 'POST', data: loginData });
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    console.log('✅ Admin login successful!');
    console.log('📊 Response:', response.data);
    if (response.data?.token) {
      console.log('🔐 Token:', String(response.data.token).substring(0, 40) + '...');
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testAdminLogin()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAdminLogin };
