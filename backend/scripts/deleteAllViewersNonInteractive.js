// backend/scripts/deleteAllViewersNonInteractive.js
// Non-interactive script to delete all viewer user accounts from the database
// This script will remove all viewers while preserving advertisers and admins

const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');
const { 
  sequelize, 
  User, 
  Wallet, 
  Transaction, 
  Withdrawal, 
  ViewEvent, 
  Comment,
  CommentLike,
  Session
} = require(modelsPath);

async function deleteAllViewers() {
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

    // 3. Count existing users by role
    const userCounts = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    console.log('📊 Current user distribution:');
    userCounts.forEach(count => {
      console.log(`   ${count.role}: ${count.count} users`);
    });

    // 4. Find all viewer users
    const viewers = await User.findAll({
      where: { role: 'viewer' },
      attributes: ['id', 'name', 'phone', 'civil_id', 'created_at']
    });

    if (viewers.length === 0) {
      console.log('✅ No viewer accounts found to delete');
      process.exit(0);
    }

    console.log(`🔍 Found ${viewers.length} viewer accounts to delete:`);
    viewers.forEach(viewer => {
      console.log(`   - ${viewer.name} (${viewer.phone}) - Created: ${viewer.created_at}`);
    });

    // 5. Safety warning
    console.log('\n⚠️  WARNING: Proceeding to delete ALL viewer accounts!');
    console.log('   This action cannot be undone.');
    console.log('   The system will continue to function normally for advertisers and admins.');
    
    // 6. Start transaction for safe deletion
    const transaction = await sequelize.transaction();
    
    try {
      console.log('\n🔄 Starting deletion process...');

      // 7. Delete all viewer-related data in proper order
      
      // Delete sessions for viewers
      const deletedSessions = await Session.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedSessions} viewer sessions`);

      // Delete comment likes for viewers
      const deletedCommentLikes = await CommentLike.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedCommentLikes} viewer comment likes`);

      // Delete comments by viewers
      const deletedComments = await Comment.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedComments} viewer comments`);

      // Delete view events for viewers
      const deletedViewEvents = await ViewEvent.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedViewEvents} viewer view events`);

      // Delete transactions for viewers
      const deletedTransactions = await Transaction.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedTransactions} viewer transactions`);

      // Delete withdrawals for viewers
      const deletedWithdrawals = await Withdrawal.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedWithdrawals} viewer withdrawals`);

      // Delete wallets for viewers
      const deletedWallets = await Wallet.destroy({
        where: { 
          user_id: viewers.map(v => v.id) 
        },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedWallets} viewer wallets`);

      // 8. Finally, delete all viewer users
      const deletedUsers = await User.destroy({
        where: { role: 'viewer' },
        transaction
      });
      console.log(`🗑️ Deleted ${deletedUsers} viewer user records`);

      // 9. Commit transaction
      await transaction.commit();
      console.log('\n✅ All viewer accounts and related data deleted successfully!');

      // 10. Verify deletion
      const remainingUsers = await User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['role'],
        raw: true
      });

      console.log('\n📊 Updated user distribution:');
      remainingUsers.forEach(count => {
        console.log(`   ${count.role}: ${count.count} users`);
      });

      console.log('\n🎯 System is ready for new viewer registrations');

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error deleting viewer accounts:', err);
    process.exit(1);
  }
}

// Run the script
deleteAllViewers();
