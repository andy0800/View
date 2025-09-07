// backend/scripts/wipeAllData.js
// ⚠️ WARNING: This script will DELETE ALL DATA from the database
// Use with extreme caution - this action cannot be undone!

const { sequelize } = require('../src/models');
const db = require('../src/models');

async function wipeAllData() {
  try {
    console.log('🚨 STARTING COMPLETE DATABASE WIPE...');
    console.log('⚠️  This will delete ALL data from ALL tables!');
    console.log('📋 Tables to be wiped:');
    
    // List all models/tables
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize' && typeof db[key] === 'object'
    );
    
    console.log('📊 Found models:', modelNames.join(', '));
    
    // Disable foreign key checks temporarily (PostgreSQL)
    await sequelize.query('SET session_replication_role = replica;');
    
    // Wipe data in proper order to avoid foreign key constraint issues
    const wipeOrder = [
      // 1. First wipe dependent/child tables
      'ViewEvent',
      'CommentLike', 
      'Comment',
      'AdAppeal',
      'AdVerificationHistory',
      'Transaction',
      'Withdrawal',
      'Wallet',
      'CompanyWallet',
      'PurchasedPackage',
      'OtpCode',
      'Session',
      
      // 2. Then wipe main content tables
      'Ad',
      'Video',
      
      // 3. Then wipe user tables
      'User',
      'Advertiser', 
      'Viewer',
      
      // 4. Finally wipe configuration tables
      'AdvertiserPackage',
      'Section'
    ];
    
    console.log('\n🧹 Starting data wipe in proper order...');
    
    for (const modelName of wipeOrder) {
      if (db[modelName]) {
        try {
          const count = await db[modelName].count();
          if (count > 0) {
            await db[modelName].destroy({ 
              where: {},
              force: true, // Hard delete
              truncate: true // Faster than delete
            });
            console.log(`✅ Wiped ${modelName}: ${count} records deleted`);
          } else {
            console.log(`ℹ️  ${modelName}: No data to delete`);
          }
        } catch (error) {
          console.log(`⚠️  Error wiping ${modelName}:`, error.message);
        }
      } else {
        console.log(`⚠️  Model ${modelName} not found, skipping...`);
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET session_replication_role = DEFAULT;');
    
    // Verify all tables are empty
    console.log('\n🔍 Verifying all tables are empty...');
    let totalRecords = 0;
    
    for (const modelName of modelNames) {
      if (db[modelName] && typeof db[modelName].count === 'function') {
        try {
          const count = await db[modelName].count();
          totalRecords += count;
          if (count > 0) {
            console.log(`⚠️  ${modelName}: Still has ${count} records`);
          } else {
            console.log(`✅ ${modelName}: Confirmed empty`);
          }
        } catch (error) {
          console.log(`⚠️  Error checking ${modelName}:`, error.message);
        }
      }
    }
    
    if (totalRecords === 0) {
      console.log('\n🎉 SUCCESS: All data has been completely wiped!');
      console.log('📊 Total records remaining: 0');
      console.log('🗄️  Database schema preserved and ready for fresh data');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain');
      console.log(`📊 Total records remaining: ${totalRecords}`);
    }
    
  } catch (error) {
    console.error('❌ ERROR during data wipe:', error);
    throw error;
  } finally {
    // Always close the connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the wipe function
if (require.main === module) {
  wipeAllData()
    .then(() => {
      console.log('\n✅ Data wipe completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Data wipe failed:', error);
      process.exit(1);
    });
}

module.exports = wipeAllData;
