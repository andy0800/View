// backend/scripts/testConnection.js
// Simple script to test database connectivity and model loading

const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');

console.log('🔍 Testing database connection and model loading...');

try {
  const { sequelize, User } = require(modelsPath);
  
  console.log('✅ Models loaded successfully');
  console.log('🔍 Database config:', {
    host: sequelize.config.host,
    port: sequelize.config.port,
    database: sequelize.config.database,
    username: sequelize.config.username
  });

  // Test connection
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection successful');
      
      // Test basic query
      return User.count();
    })
    .then(count => {
      console.log(`✅ Database query successful - Total users: ${count}`);
      console.log('🎯 Database is ready for operations');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    });

} catch (err) {
  console.error('❌ Error loading models:', err.message);
  process.exit(1);
}
