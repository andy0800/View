const http = require('http');

const postData = JSON.stringify({
  username: process.env.ADMIN_USERNAME || 'admin@example.com',
  password: process.env.ADMIN_PASSWORD || 'ChangeMe123'
});

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing admin login with:');
console.log('Username:', process.env.ADMIN_USERNAME || 'admin@example.com');
console.log('Password:', (process.env.ADMIN_PASSWORD || 'ChangeMe123').replace(/./g, '*'));
console.log();

const req = http.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📡 Response Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📡 Response Body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('📊 Parsed Response:', parsed);
      
      if (parsed.token) {
        console.log('✅ Token received:', parsed.token.substring(0, 20) + '...');
      } else {
        console.log('❌ No token in response');
      }
    } catch (e) {
      console.log('❌ Failed to parse response as JSON');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request failed:', err.message);
});

req.write(postData);
req.end();
