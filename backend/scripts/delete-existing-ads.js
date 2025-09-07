const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

// Create Sequelize instance
const sequelize = new Sequelize(config.development);

async function deleteExistingAds() {
  try {
    console.log('🗑️ Starting cleanup of existing ads and related data...\n');

    // Test database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Get current counts
    console.log('2️⃣ Getting current data counts...');
    
    const advertiserPackagesCount = await sequelize.query('SELECT COUNT(*) as count FROM advertiser_packages', { type: Sequelize.QueryTypes.SELECT });
    const purchasedPackagesCount = await sequelize.query('SELECT COUNT(*) as count FROM purchased_packages', { type: Sequelize.QueryTypes.SELECT });
    const adsCount = await sequelize.query('SELECT COUNT(*) as count FROM ads', { type: Sequelize.QueryTypes.SELECT });
    const viewEventsCount = await sequelize.query('SELECT COUNT(*) as count FROM view_events', { type: Sequelize.QueryTypes.SELECT });
    const transactionsCount = await sequelize.query('SELECT COUNT(*) as count FROM transactions', { type: Sequelize.QueryTypes.SELECT });
    const walletsCount = await sequelize.query('SELECT COUNT(*) as count FROM wallets', { type: Sequelize.QueryTypes.SELECT });

    console.log(`📦 advertiser_packages: ${advertiserPackagesCount[0].count}`);
    console.log(`📦 purchased_packages: ${purchasedPackagesCount[0].count}`);
    console.log(`📺 ads: ${adsCount[0].count}`);
    console.log(`👁️ view_events: ${viewEventsCount[0].count}`);
    console.log(`💳 transactions: ${transactionsCount[0].count}`);
    console.log(`💰 wallets: ${walletsCount[0].count}\n`);

    // Start transaction for safe deletion
    const transaction = await sequelize.transaction();

    try {
      console.log('3️⃣ Starting deletion process...');

      // Delete in order to respect foreign key constraints
      
      // 1. Delete view events first (they reference ads and packages)
      console.log('🗑️ Deleting view_events...');
      await sequelize.query('DELETE FROM view_events', { transaction });
      console.log('✅ view_events deleted');

      // 2. Delete ads (they reference purchased packages)
      console.log('🗑️ Deleting ads...');
      await sequelize.query('DELETE FROM ads', { transaction });
      console.log('✅ ads deleted');

      // 3. Delete purchased packages (they reference advertiser packages)
      console.log('🗑️ Deleting purchased_packages...');
      await sequelize.query('DELETE FROM purchased_packages', { transaction });
      console.log('✅ purchased_packages deleted');

      // 4. Delete transactions (they reference wallets and other entities)
      console.log('🗑️ Deleting transactions...');
      await sequelize.query('DELETE FROM transactions', { transaction });
      console.log('✅ transactions deleted');

      // 5. Delete wallets (they reference users)
      console.log('🗑️ Deleting wallets...');
      await sequelize.query('DELETE FROM wallets', { transaction });
      console.log('✅ wallets deleted');

      // 6. Delete advertiser packages (base packages)
      console.log('🗑️ Deleting advertiser_packages...');
      await sequelize.query('DELETE FROM advertiser_packages', { transaction });
      console.log('✅ advertiser_packages deleted');

      // Commit the transaction
      await transaction.commit();
      console.log('\n✅ All deletions committed successfully!');

      // Verify deletion
      console.log('\n4️⃣ Verifying deletion...');
      
      const advertiserPackagesCountAfter = await sequelize.query('SELECT COUNT(*) as count FROM advertiser_packages', { type: Sequelize.QueryTypes.SELECT });
      const purchasedPackagesCountAfter = await sequelize.query('SELECT COUNT(*) as count FROM purchased_packages', { type: Sequelize.QueryTypes.SELECT });
      const adsCountAfter = await sequelize.query('SELECT COUNT(*) as count FROM ads', { type: Sequelize.QueryTypes.SELECT });
      const viewEventsCountAfter = await sequelize.query('SELECT COUNT(*) as count FROM view_events', { type: Sequelize.QueryTypes.SELECT });
      const transactionsCountAfter = await sequelize.query('SELECT COUNT(*) as count FROM transactions', { type: Sequelize.QueryTypes.SELECT });
      const walletsCountAfter = await sequelize.query('SELECT COUNT(*) as count FROM wallets', { type: Sequelize.QueryTypes.SELECT });

      console.log(`📦 advertiser_packages: ${advertiserPackagesCountAfter[0].count} (was ${advertiserPackagesCount[0].count})`);
      console.log(`📦 purchased_packages: ${purchasedPackagesCountAfter[0].count} (was ${purchasedPackagesCount[0].count})`);
      console.log(`📺 ads: ${adsCountAfter[0].count} (was ${adsCount[0].count})`);
      console.log(`👁️ view_events: ${viewEventsCountAfter[0].count} (was ${viewEventsCount[0].count})`);
      console.log(`💳 transactions: ${transactionsCountAfter[0].count} (was ${transactionsCount[0].count})`);
      console.log(`💰 wallets: ${walletsCountAfter[0].count} (was ${walletsCount[0].count})`);

      console.log('\n🎉 Cleanup completed successfully! Database is now ready for the new ads system.');

    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      console.error('❌ Error during deletion, rolling back:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the cleanup
deleteExistingAds();
