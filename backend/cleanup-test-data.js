require('dotenv').config();
const { sequelize, User, Ad, PurchasedPackage, Wallet } = require('./src/models');

async function cleanupTestData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Clean up ads first
    const adsDeleted = await Ad.destroy({
      where: {
        title: {
          [require('sequelize').Op.like]: 'Comprehensive Test Ad%'
        }
      }
    });
    console.log(`✅ Deleted ${adsDeleted} test ads`);

    // Clean up purchased packages
    const packagesDeleted = await PurchasedPackage.destroy({
      where: {
        advertiser_id: {
          [require('sequelize').Op.in]: (
            await User.findAll({
              where: {
                name: { [require('sequelize').Op.like]: 'Comprehensive Test Advertiser%' },
                role: 'advertiser'
              },
              attributes: ['id']
            })
          ).map(u => u.id)
        }
      }
    });
    console.log(`✅ Deleted ${packagesDeleted} test purchased packages`);

    // Clean up wallets
    const walletsDeleted = await Wallet.destroy({
      where: {
        user_id: {
          [require('sequelize').Op.in]: (
            await User.findAll({
              where: {
                name: { [require('sequelize').Op.like]: 'Comprehensive Test%' },
                role: { [require('sequelize').Op.in]: ['advertiser', 'admin'] }
              },
              attributes: ['id']
            })
          ).map(u => u.id)
        }
      }
    });
    console.log(`✅ Deleted ${walletsDeleted} test wallets`);

    // Clean up sessions first
    const sessionsDeleted = await sequelize.query(`
      DELETE FROM sessions 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE name LIKE 'Comprehensive Test%'
      )
    `);
    console.log(`✅ Deleted sessions for test users`);

    // Clean up test users
    const usersDeleted = await User.destroy({
      where: {
        name: { [require('sequelize').Op.like]: 'Comprehensive Test%' }
      }
    });
    console.log(`✅ Deleted ${usersDeleted} test users`);

    console.log('✅ Test data cleanup completed');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupTestData();
