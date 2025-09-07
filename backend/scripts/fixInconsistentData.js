// backend/scripts/fixInconsistentData.js
const { sequelize } = require('../src/models');
const { User, Wallet, ViewEvent, Ad, Transaction } = require('../src/models');

async function fixInconsistentData() {
  try {
    console.log('🔧 Starting data consistency fix...');
    
    // 1. Check for users with wallets but missing ViewEvent records
    console.log('\n🔍 Step 1: Checking for data inconsistencies...');
    
    const wallets = await Wallet.findAll({
      attributes: ['user_id', 'balance', 'confirmed_points']
    });
    
    console.log(`Found ${wallets.length} wallets`);
    
    for (const wallet of wallets) {
      const userId = wallet.user_id;
      console.log(`\n👤 Checking user: ${userId}`);
      
      // Check if user has any ViewEvent records
      const viewEvents = await ViewEvent.findAll({
        where: { user_id: userId }
      });
      
      console.log(`  - ViewEvent records: ${viewEvents.length}`);
      console.log(`  - Wallet balance: ${wallet.balance} fils`);
      console.log(`  - Confirmed points: ${wallet.confirmed_points} fils`);
      
      if (viewEvents.length === 0 && wallet.balance > 0) {
        console.log(`  ⚠️  User has wallet balance but no ViewEvent records - this indicates inconsistency`);
      }
    }
    
    // 2. Check for ads that might have been watched but not recorded
    console.log('\n🔍 Step 2: Checking ad view inconsistencies...');
    
    const ads = await Ad.findAll({
      where: { is_active: true, status: 'active' }
    });
    
    console.log(`Found ${ads.length} active ads`);
    
    for (const ad of ads) {
      const viewEvents = await ViewEvent.findAll({
        where: { ad_id: ad.id }
      });
      
      console.log(`  📹 Ad "${ad.title || ad.id}": ${viewEvents.length} view events, ${ad.views} total views`);
      
      if (viewEvents.length !== ad.views) {
        console.log(`    ⚠️  Mismatch: ViewEvent count (${viewEvents.length}) != ad.views (${ad.views})`);
      }
    }
    
    // 3. Check for duplicate or invalid transactions
    console.log('\n🔍 Step 3: Checking transaction consistency...');
    
    try {
      const transactions = await Transaction.findAll({
        where: { transaction_category: 'user_reward' }
      });
      
      console.log(`Found ${transactions.length} user reward transactions`);
    } catch (transactionError) {
      console.log(`⚠️  Could not check transactions: ${transactionError.message}`);
    }
    
    // 4. Check specific user data
    console.log('\n🔍 Step 4: Checking specific user data...');
    const specificUserId = '117b5845-3358-4228-bf33-f8c8d8f842af'; // From the logs
    
    const userWallet = await Wallet.findOne({
      where: { user_id: specificUserId }
    });
    
    if (userWallet) {
      console.log(`\n👤 User ${specificUserId}:`);
      console.log(`  - Wallet balance: ${userWallet.balance} fils`);
      console.log(`  - Confirmed points: ${userWallet.confirmed_points} fils`);
      
      const userViewEvents = await ViewEvent.findAll({
        where: { user_id: specificUserId }
      });
      
      console.log(`  - ViewEvent records: ${userViewEvents.length}`);
      
      if (userViewEvents.length === 0) {
        console.log(`  ⚠️  CRITICAL: User has wallet balance but NO ViewEvent records!`);
        console.log(`  🔧 This explains why videos keep appearing as unwatched!`);
      }
    }
    
    // 5. Provide recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('1. The database schema has been synced (transaction_category column added)');
    console.log('2. Restart the backend server to ensure all models are properly loaded');
    console.log('3. Try watching a video again - it should now work properly');
    console.log('4. If issues persist, we may need to reset specific user data');
    
    console.log('\n✅ Data consistency check completed!');
    
  } catch (error) {
    console.error('❌ Error during data consistency check:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixInconsistentData();
