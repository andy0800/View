// backend/scripts/fixWalletSchema.js
// Script to fix wallet schema and ensure all required columns exist

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function fixWalletSchema() {
  try {
    console.log('🔧 Fixing wallet schema...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check current wallet table structure
    console.log('📋 Checking current wallet table structure...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position;
    `);

    console.log('Current wallet columns:');
    results.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if balance_micro exists
    const hasBalanceMicro = results.some(col => col.column_name === 'balance_micro');
    const hasHeldMicro = results.some(col => col.column_name === 'held_micro');
    const hasConfirmedPoints = results.some(col => col.column_name === 'confirmed_points');
    const hasPendingPoints = results.some(col => col.column_name === 'pending_points');

    console.log('\n📊 Column status:');
    console.log(`   • balance_micro: ${hasBalanceMicro ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   • held_micro: ${hasHeldMicro ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   • confirmed_points: ${hasConfirmedPoints ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   • pending_points: ${hasPendingPoints ? '✅ EXISTS' : '❌ MISSING'}`);

    if (!hasBalanceMicro || !hasHeldMicro || !hasConfirmedPoints || !hasPendingPoints) {
      console.log('\n🔧 Adding missing columns...');

      if (!hasBalanceMicro) {
        console.log('   Adding balance_micro column...');
        await sequelize.query(`
          ALTER TABLE wallets 
          ADD COLUMN balance_micro BIGINT NOT NULL DEFAULT 0;
        `);
        console.log('   ✅ Added balance_micro');
      }

      if (!hasHeldMicro) {
        console.log('   Adding held_micro column...');
        await sequelize.query(`
          ALTER TABLE wallets 
          ADD COLUMN held_micro BIGINT NOT NULL DEFAULT 0;
        `);
        console.log('   ✅ Added held_micro');
      }

      if (!hasConfirmedPoints) {
        console.log('   Adding confirmed_points column...');
        await sequelize.query(`
          ALTER TABLE wallets 
          ADD COLUMN confirmed_points INTEGER NOT NULL DEFAULT 0;
        `);
        console.log('   ✅ Added confirmed_points');
      }

      if (!hasPendingPoints) {
        console.log('   Adding pending_points column...');
        await sequelize.query(`
          ALTER TABLE wallets 
          ADD COLUMN pending_points INTEGER NOT NULL DEFAULT 0;
        `);
        console.log('   ✅ Added pending_points');
      }

      // Migrate existing balance data to micro units
      console.log('\n📝 Migrating existing balance data...');
      await sequelize.query(`
        UPDATE wallets 
        SET balance_micro = COALESCE(balance_micro, CAST(COALESCE(balance, 0) * 1000000 AS BIGINT))
        WHERE balance_micro = 0 OR balance_micro IS NULL;
      `);
      console.log('   ✅ Migrated balance data');

      // Add indexes
      console.log('\n📝 Adding performance indexes...');
      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_wallets_balance_micro ON wallets(balance_micro);
        `);
        console.log('   ✅ Added balance_micro index');
      } catch (err) {
        console.log('   ⚠️ balance_micro index already exists');
      }

      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_wallets_held_micro ON wallets(held_micro);
        `);
        console.log('   ✅ Added held_micro index');
      } catch (err) {
        console.log('   ⚠️ held_micro index already exists');
      }

      console.log('\n🎉 Wallet schema fix completed!');
    } else {
      console.log('\n✅ All required columns already exist - no fix needed');
    }

    // Verify final structure
    console.log('\n📋 Final wallet table structure:');
    const [finalResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position;
    `);

    finalResults.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Wallet schema verification completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing wallet schema:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the fix
if (require.main === module) {
  fixWalletSchema()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixWalletSchema };
