const http = require('http');

const testData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('🔍 Testing admin login route...');
console.log('🔍 URL:', `http://localhost:4001/auth/admin-login`);
console.log('🔍 Request body:', testData);

const req = http.request(options, (res) => {
  console.log('🔍 Response status:', res.statusCode);
  console.log('🔍 Response headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('🔍 Response body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('🔍 Parsed response:', parsed);
    } catch (e) {
      console.log('🔍 Response is not JSON');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(testData);
req.end();
