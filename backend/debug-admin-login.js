// Debug script to test admin login
console.log('Environment variables:');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME || 'undefined (using default: admin)');
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD || 'undefined (using default: admin123)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');

// Test the logic directly
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

console.log('\nExpected credentials:');
console.log('Username:', ADMIN_USERNAME);
console.log('Password:', ADMIN_PASSWORD);

console.log('\nTesting comparison:');
const testUsername = 'admin';
const testPassword = 'admin123';

console.log(`"${testUsername}" === "${ADMIN_USERNAME}":`, testUsername === ADMIN_USERNAME);
console.log(`"${testPassword}" === "${ADMIN_PASSWORD}":`, testPassword === ADMIN_PASSWORD);

// Check for any hidden characters
console.log('\nUsername length:', ADMIN_USERNAME.length);
console.log('Password length:', ADMIN_PASSWORD.length);
console.log('Username char codes:', [...ADMIN_USERNAME].map(c => c.charCodeAt(0)));
console.log('Password char codes:', [...ADMIN_PASSWORD].map(c => c.charCodeAt(0)));
