// backend/scripts/deleteUserData.js

const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');
const { 
  sequelize, 
  User, 
  Wallet, 
  Transaction, 
  Withdrawal, 
  ViewEvent, 
  Ad, 
  Video, 
  Session 
} = require(modelsPath);

const PHONE_NUMBER = '+96592209792';

async function deleteUserData() {
  try {
    // 1. Log the active DB connection
    console.log(
      '🔍 Connecting to:',
      sequelize.config.database,
      '@',
      sequelize.config.host,
      `(env=${process.env.NODE_ENV || 'development'})`
    );

    // 2. Authenticate & set public schema
    await sequelize.authenticate();
    console.log('▶️ Database connected');
    await sequelize.query('SET search_path TO public;');

    // 3. Find user by phone number
    console.log(`🔍 Looking for user with phone: ${PHONE_NUMBER}`);
    const user = await User.findOne({ where: { phone: PHONE_NUMBER } });
    
    if (!user) {
      console.log(`❌ No user found with phone number: ${PHONE_NUMBER}`);
      process.exit(0);
    }

    console.log(`✅ Found user: ${user.name} (ID: ${user.id}, Role: ${user.role})`);

    // 4. Start transaction for safe deletion
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🔄 Starting deletion process...');

      // 5. Delete sessions
      const deletedSessions = await Session.destroy({
        where: { user_id: user.id },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedSessions} sessions`);

      // 6. Delete view events
      const deletedViewEvents = await ViewEvent.destroy({
        where: { user_id: user.id },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedViewEvents} view events`);

      // 7. Delete transactions
      const deletedTransactions = await Transaction.destroy({
        where: { user_id: user.id },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedTransactions} transactions`);

      // 8. Delete withdrawals
      const deletedWithdrawals = await Withdrawal.destroy({
        where: { user_id: user.id },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedWithdrawals} withdrawals`);

      // 9. If user is advertiser, delete ads and videos
      if (user.role === 'advertiser') {
        // Delete ads
        const deletedAds = await Ad.destroy({
          where: { advertiser_id: user.id },
          transaction
        });
        console.log(`🗑️ Deleted ${deletedAds} ads`);

        // Delete videos
        const deletedVideos = await Video.destroy({
          where: { advertiser_id: user.id },
          transaction
        });
        console.log(`🗑️ Deleted ${deletedVideos} videos`);
      }

      // 10. Delete wallet
      const deletedWallets = await Wallet.destroy({
        where: { user_id: user.id },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedWallets} wallets`);

      // 11. Finally, delete the user
      const deletedUsers = await User.destroy({
        where: { id: user.id },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedUsers} user records`);

      // 12. Commit transaction
      await transaction.commit();
      console.log('✅ All user data deleted successfully!');

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error deleting user data:', err);
    process.exit(1);
  }
}

// Run the script
deleteUserData();
