// test-db-connection.js
// Simple test script to check database connection

console.log('🧪 Testing database connection...');

try {
  // Test basic requires
  console.log('📦 Loading dependencies...');
  require('dotenv').config();
  console.log('✅ dotenv loaded');
  
  const { sequelize } = require('./src/models');
  console.log('✅ Models loaded');
  
  // Test database connection
  console.log('🔌 Testing database connection...');
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection successful!');
      console.log('🔍 Database name:', sequelize.config.database);
      console.log('🔍 Database host:', sequelize.config.host);
      console.log('🔍 Database port:', sequelize.config.port);
      
      // Test basic query
      return sequelize.query('SELECT NOW() as current_time');
    })
    .then(([results]) => {
      console.log('✅ Database query successful!');
      console.log('⏰ Current database time:', results[0].current_time);
      
      console.log('\n🎉 All tests passed! Database is working correctly.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Script error:', error.message);
  console.error('📋 Error details:', error);
  process.exit(1);
}
