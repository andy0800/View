console.log('🚀 Test script is running!');
console.log('Current directory:', process.cwd());
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

// Test dotenv
require('dotenv').config();
console.log('After dotenv:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
