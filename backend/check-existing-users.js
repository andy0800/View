require('dotenv').config();
const { sequelize, User } = require('./src/models');

async function checkExistingUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check for users with phone numbers in the test range
    const { Op } = require('sequelize');
    const testUsers = await User.findAll({
      where: {
        phone: {
          [Op.like]: '+9655000%'
        }
      },
      attributes: ['id', 'name', 'phone', 'role', 'created_at']
    });

    console.log(`\n📊 Found ${testUsers.length} existing test users:`);
    testUsers.forEach(user => {
      console.log(`- ${user.phone} (${user.role}) - ${user.name} - Created: ${user.created_at}`);
    });

    if (testUsers.length > 0) {
      console.log('\n🧹 Cleaning up existing test users...');
      
      // Delete related records first
      await sequelize.query(`
        DELETE FROM sessions 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE phone LIKE '+9655000%'
        )
      `);

      await sequelize.query(`
        DELETE FROM wallets 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE phone LIKE '+9655000%'
        )
      `);

      await sequelize.query(`
        DELETE FROM purchased_packages 
        WHERE advertiser_id IN (
          SELECT id FROM users 
          WHERE phone LIKE '+9655000%'
        )
      `);

      await sequelize.query(`
        DELETE FROM ads 
        WHERE advertiser_id IN (
          SELECT id FROM users 
          WHERE phone LIKE '+9655000%'
        )
      `);

      // Now delete the users
      const deletedCount = await User.destroy({
        where: {
          phone: {
            [Op.like]: '+9655000%'
          }
        }
      });

      console.log(`✅ Deleted ${deletedCount} test users`);
    } else {
      console.log('✅ No existing test users found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkExistingUsers();
