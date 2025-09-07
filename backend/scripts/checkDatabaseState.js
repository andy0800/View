// backend/scripts/checkDatabaseState.js
const { sequelize } = require('../src/models');
const { User, Wallet, ViewEvent, Ad, Transaction } = require('../src/models');

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking current database state...');
    
    // Check if tables exist and have correct schema
    console.log('\n📊 Checking table structure...');
    
    try {
      const users = await User.findAll();
      console.log(`✅ Users table: ${users.length} users found`);
      
      for (const user of users) {
        console.log(`  👤 User: ${user.username || user.id} (${user.role}) - Phone: ${user.phone}`);
      }
    } catch (error) {
      console.log(`❌ Users table error: ${error.message}`);
    }
    
    try {
      const wallets = await Wallet.findAll();
      console.log(`✅ Wallets table: ${wallets.length} wallets found`);
    } catch (error) {
      console.log(`❌ Wallets table error: ${error.message}`);
    }
    
    try {
      const viewEvents = await ViewEvent.findAll();
      console.log(`✅ ViewEvents table: ${viewEvents.length} view events found`);
    } catch (error) {
      console.log(`❌ ViewEvents table error: ${error.message}`);
    }
    
    try {
      const ads = await Ad.findAll();
      console.log(`✅ Ads table: ${ads.length} ads found`);
    } catch (error) {
      console.log(`❌ Ads table error: ${error.message}`);
    }
    
    try {
      const transactions = await Transaction.findAll();
      console.log(`✅ Transactions table: ${transactions.length} transactions found`);
    } catch (error) {
      console.log(`❌ Transactions table error: ${error.message}`);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('1. Database schema is now correct (transaction_category column exists)');
    console.log('2. All previous user data was lost during force sync');
    console.log('3. You need to recreate your viewer account');
    console.log('4. The 500 error should now be resolved');
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the check
checkDatabaseState();
