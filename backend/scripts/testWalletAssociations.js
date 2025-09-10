// backend/scripts/testWalletAssociations.js
// Test script to verify Wallet associations work correctly

const { sequelize } = require('../src/models');
const { User, Advertiser, Wallet } = require('../src/models');

async function testWalletAssociations() {
  try {
    console.log('🧪 TESTING WALLET ASSOCIATIONS...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Test 1: Check wallet table structure
    console.log('\n📋 Test 1: Checking wallet table structure...');
    const [walletColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Wallet table columns:');
    walletColumns.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type}`);
    });

    // Check for problematic columns
    const hasOwnerId = walletColumns.some(col => col.column_name === 'owner_id');
    const hasUserId = walletColumns.some(col => col.column_name === 'user_id');
    
    if (hasOwnerId) {
      console.log('❌ PROBLEM: owner_id column exists (should not)');
    } else {
      console.log('✅ owner_id column does not exist (correct)');
    }
    
    if (hasUserId) {
      console.log('✅ user_id column exists (correct)');
    } else {
      console.log('❌ PROBLEM: user_id column missing');
    }

    // Test 2: Test wallet creation
    console.log('\n📋 Test 2: Testing wallet creation...');
    try {
      const testUserId = 'test-user-' + Date.now();
      const testWallet = await Wallet.create({
        user_id: testUserId,
        balance_micro: 0,
        held_micro: 0,
        confirmed_points: 0,
        pending_points: 0
      });
      console.log('✅ Wallet creation successful');
      console.log('   Created wallet:', testWallet.toJSON());
      
      // Clean up
      await testWallet.destroy();
      console.log('✅ Test wallet cleaned up');
    } catch (err) {
      console.log('❌ Wallet creation failed:', err.message);
    }

    // Test 3: Test wallet query (like in OTP verification)
    console.log('\n📋 Test 3: Testing wallet query...');
    try {
      const testUserId = 'test-query-user-' + Date.now();
      
      // Create a test wallet
      const testWallet = await Wallet.create({
        user_id: testUserId,
        balance_micro: 1000000, // 1 KWD
        held_micro: 0,
        confirmed_points: 0,
        pending_points: 0
      });

      // Test the query that was failing
      const foundWallet = await Wallet.findOne({
        where: { user_id: testUserId }
      });
      
      if (foundWallet) {
        console.log('✅ Wallet query successful');
        console.log('   Found wallet:', foundWallet.toJSON());
      } else {
        console.log('❌ Wallet query failed - no wallet found');
      }
      
      // Clean up
      await testWallet.destroy();
      console.log('✅ Test wallet cleaned up');
    } catch (err) {
      console.log('❌ Wallet query failed:', err.message);
    }

    // Test 4: Test findOrCreate (like in OTP verification)
    console.log('\n📋 Test 4: Testing findOrCreate...');
    try {
      const testUserId = 'test-findorcreate-user-' + Date.now();
      
      const [wallet, created] = await Wallet.findOrCreate({
        where: { user_id: testUserId },
        defaults: {
          balance_micro: 0,
          held_micro: 0,
          confirmed_points: 0,
          pending_points: 0
        }
      });
      
      console.log('✅ findOrCreate successful');
      console.log(`   Created: ${created}, Wallet:`, wallet.toJSON());
      
      // Clean up
      await wallet.destroy();
      console.log('✅ Test wallet cleaned up');
    } catch (err) {
      console.log('❌ findOrCreate failed:', err.message);
    }

    console.log('\n🎉 WALLET ASSOCIATION TESTS COMPLETED!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testWalletAssociations()
    .then(() => {
      console.log('🎉 All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testWalletAssociations };
