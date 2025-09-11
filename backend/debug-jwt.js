// Debug JWT token from the request
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEyOWI4NjM2LWQwMGYtNDliNC1iYTVjLWZkZTVhMzk0YWYxNiIsImlhdCI6MTc1NzU4NzY2NSwiZXhwIjoxNzYwMTc5NjY1fQ.B540h5OThYBgG2vGLYNUQJ7Z1hM33gUzVbB9BREF9-g';

console.log('🔍 Debugging JWT Token...');
console.log('================================');

try {
  const decoded = jwt.decode(token);
  console.log('✅ JWT Decoded Successfully:');
  console.log('User ID:', decoded.id);
  console.log('Role:', decoded.role);
  console.log('Issued At:', new Date(decoded.iat * 1000));
  console.log('Expires At:', new Date(decoded.exp * 1000));
  console.log('');
  
  // Check if this is an admin user
  if (decoded.id === '00000000-0000-0000-0000-000000000000' || decoded.role === 'admin') {
    console.log('🚨 This is an ADMIN user - should be blocked by our fix');
  } else {
    console.log('✅ This is a regular user - should be allowed');
  }
  
  console.log('');
  console.log('🔍 Testing the exact query that would be executed:');
  console.log('SELECT pp.*, ap.name as package_name');
  console.log('FROM purchased_packages pp');
  console.log('LEFT JOIN advertiser_packages ap ON pp.package_id = ap.id');
  console.log(`WHERE pp.advertiser_id = '${decoded.id}'`);
  console.log('  AND pp.status = \'active\'');
  console.log('  AND pp.remaining_micro > 0');
  console.log('ORDER BY pp.purchased_at ASC;');
  
} catch (error) {
  console.error('❌ Error decoding JWT:', error.message);
}
