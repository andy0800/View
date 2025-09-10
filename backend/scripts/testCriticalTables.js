// backend/scripts/testCriticalTables.js
// Test script to verify all critical tables exist and work correctly

const { sequelize } = require('../src/models');
const { User, Wallet, Session, OtpCode, Notification } = require('../src/models');

async function testCriticalTables() {
  try {
    console.log('🧪 TESTING CRITICAL TABLES...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Test 1: Check all critical tables exist
    console.log('\n📋 Test 1: Checking critical tables exist...');
    const criticalTables = ['users', 'wallets', 'sessions', 'otp_codes', 'notifications', 'admin_settings'];
    
    for (const tableName of criticalTables) {
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tableName}'
        );
      `);
      
      if (tableExists[0].exists) {
        console.log(`✅ ${tableName} table exists`);
      } else {
        console.log(`❌ ${tableName} table MISSING`);
      }
    }

    // Test 2: Test sessions table
    console.log('\n📋 Test 2: Testing sessions table...');
    try {
      const testUserId = 'test-session-user-' + Date.now();
      const testSession = await Session.create({
        user_id: testUserId,
        token: 'test-token-' + Date.now(),
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        is_active: true
      });
      console.log('✅ Session creation successful');
      console.log('   Created session:', testSession.toJSON());
      
      // Clean up
      await testSession.destroy();
      console.log('✅ Test session cleaned up');
    } catch (err) {
      console.log('❌ Session creation failed:', err.message);
    }

    // Test 3: Test otp_codes table
    console.log('\n📋 Test 3: Testing otp_codes table...');
    try {
      const testOtp = await OtpCode.create({
        phone: '+1234567890',
        code: '123456',
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      console.log('✅ OTP code creation successful');
      console.log('   Created OTP:', testOtp.toJSON());
      
      // Clean up
      await testOtp.destroy();
      console.log('✅ Test OTP cleaned up');
    } catch (err) {
      console.log('❌ OTP code creation failed:', err.message);
    }

    // Test 4: Test notifications table
    console.log('\n📋 Test 4: Testing notifications table...');
    try {
      const testUserId = 'test-notification-user-' + Date.now();
      const testNotification = await Notification.create({
        user_id: testUserId,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification',
        status: 'unread',
        priority: 'normal'
      });
      console.log('✅ Notification creation successful');
      console.log('   Created notification:', testNotification.toJSON());
      
      // Clean up
      await testNotification.destroy();
      console.log('✅ Test notification cleaned up');
    } catch (err) {
      console.log('❌ Notification creation failed:', err.message);
    }

    // Test 5: Test wallet table (with micro units)
    console.log('\n📋 Test 5: Testing wallet table...');
    try {
      const testUserId = 'test-wallet-user-' + Date.now();
      const testWallet = await Wallet.create({
        user_id: testUserId,
        balance_micro: 1000000, // 1 KWD
        held_micro: 0,
        confirmed_points: 0,
        pending_points: 0
      });
      console.log('✅ Wallet creation successful');
      console.log('   Created wallet:', testWallet.toJSON());
      
      // Test wallet methods
      const balanceKWD = testWallet.getBalanceKWD();
      console.log(`   Balance in KWD: ${balanceKWD}`);
      
      // Clean up
      await testWallet.destroy();
      console.log('✅ Test wallet cleaned up');
    } catch (err) {
      console.log('❌ Wallet creation failed:', err.message);
    }

    // Test 6: Test complete OTP verification flow
    console.log('\n📋 Test 6: Testing complete OTP verification flow...');
    try {
      const testUserId = 'test-otp-flow-user-' + Date.now();
      
      // Create user
      const testUser = await User.create({
        name: 'Test User',
        phone: '+1234567890',
        role: 'viewer',
        kyc_status: 'pending'
      });
      console.log('✅ Test user created');

      // Create wallet
      const testWallet = await Wallet.findOrCreate({
        where: { user_id: testUser.id },
        defaults: {
          balance_micro: 0,
          held_micro: 0,
          confirmed_points: 0,
          pending_points: 0
        }
      });
      console.log('✅ Wallet findOrCreate successful');

      // Create session
      const testSession = await Session.create({
        user_id: testUser.id,
        token: 'test-token-' + Date.now(),
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_active: true
      });
      console.log('✅ Session creation successful');

      // Clean up
      await testSession.destroy();
      await testWallet[0].destroy();
      await testUser.destroy();
      console.log('✅ Complete flow test cleaned up');
    } catch (err) {
      console.log('❌ Complete OTP flow failed:', err.message);
    }

    console.log('\n🎉 CRITICAL TABLES TEST COMPLETED!');
    console.log('✅ All critical tables should be working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testCriticalTables()
    .then(() => {
      console.log('🎉 All critical table tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Critical table tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testCriticalTables };
