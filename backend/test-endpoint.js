// Test the endpoint directly
const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEyOWI4NjM2LWQwMGYtNDliNC1iYTVjLWZkZTVhMzk0YWYxNiIsImlhdCI6MTc1NzU4NzY2NSwiZXhwIjoxNzYwMTc5NjY1fQ.B540h5OThYBgG2vGLYNUQJ7Z1hM33gUzVbB9BREF9-g';

console.log('🔍 Testing the endpoint directly...');

const options = {
  hostname: 'viewonline.me',
  port: 443,
  path: '/api/advertiser/packages/purchased',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Cookie': `token=${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    
    if (res.statusCode === 500) {
      console.log('❌ Still getting 500 error');
      console.log('This means the code changes have not been deployed to Render yet');
    } else if (res.statusCode === 200) {
      console.log('✅ Endpoint is working!');
    } else {
      console.log(`⚠️ Unexpected status code: ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();
