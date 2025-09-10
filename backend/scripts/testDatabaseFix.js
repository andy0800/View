// backend/scripts/testDatabaseFix.js
// Test script to verify database fix works

const { sequelize } = require('../src/models');
const { fixDatabaseOnStartup } = require('../src/startup/databaseFix');

async function testDatabaseFix() {
  try {
    console.log('🧪 TESTING DATABASE FIX...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Run the fix
    await fixDatabaseOnStartup();
    console.log('✅ Database fix completed');

    // Test wallet creation
    console.log('🧪 Testing wallet creation...');
    const testWallet = await sequelize.query(`
      INSERT INTO wallets (id, user_id, balance_micro, held_micro, confirmed_points, pending_points)
      VALUES (gen_random_uuid(), gen_random_uuid(), 0, 0, 0, 0)
      RETURNING id, user_id, balance_micro, held_micro, confirmed_points, pending_points;
    `);
    
    console.log('✅ Test wallet created successfully');
    console.log('   Test wallet:', testWallet[0][0]);
    
    // Clean up test wallet
    await sequelize.query(`
      DELETE FROM wallets WHERE id = '${testWallet[0][0].id}';
    `);
    console.log('✅ Test wallet cleaned up');

    // Test wallet query (like in OTP verification)
    console.log('🧪 Testing wallet query...');
    const testUserId = 'test-user-id-123';
    const walletQuery = await sequelize.query(`
      SELECT id, user_id, balance_micro, held_micro, confirmed_points, pending_points, created_at, updated_at
      FROM wallets 
      WHERE user_id = :userId 
      LIMIT 1
    `, {
      replacements: { userId: testUserId },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('✅ Wallet query executed successfully');
    console.log('   Query result:', walletQuery);

    console.log('🎉 ALL DATABASE TESTS PASSED!');
    console.log('✅ Registration and OTP verification should work');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseFix()
    .then(() => {
      console.log('🎉 Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseFix };
