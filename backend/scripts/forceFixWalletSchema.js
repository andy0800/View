// backend/scripts/forceFixWalletSchema.js
// Force fix wallet schema using direct SQL - bypasses migration system

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

async function forceFixWalletSchema() {
  try {
    console.log('🚀 FORCE FIXING WALLET SCHEMA...');
    
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

    // Force add missing columns with IF NOT EXISTS
    console.log('\n🔧 FORCE ADDING MISSING COLUMNS...');

    // Add balance_micro
    try {
      await sequelize.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS balance_micro BIGINT NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added balance_micro column');
    } catch (err) {
      console.log('⚠️ balance_micro error:', err.message);
    }

    // Add held_micro
    try {
      await sequelize.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS held_micro BIGINT NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added held_micro column');
    } catch (err) {
      console.log('⚠️ held_micro error:', err.message);
    }

    // Add confirmed_points
    try {
      await sequelize.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS confirmed_points INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added confirmed_points column');
    } catch (err) {
      console.log('⚠️ confirmed_points error:', err.message);
    }

    // Add pending_points
    try {
      await sequelize.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS pending_points INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added pending_points column');
    } catch (err) {
      console.log('⚠️ pending_points error:', err.message);
    }

    // Migrate existing balance data to micro units
    console.log('\n📝 MIGRATING EXISTING BALANCE DATA...');
    try {
      await sequelize.query(`
        UPDATE wallets 
        SET balance_micro = COALESCE(balance_micro, CAST(COALESCE(balance, 0) * 1000000 AS BIGINT))
        WHERE balance_micro = 0 OR balance_micro IS NULL;
      `);
      console.log('✅ Migrated balance data to micro units');
    } catch (err) {
      console.log('⚠️ Migration error:', err.message);
    }

    // Add indexes
    console.log('\n📝 ADDING PERFORMANCE INDEXES...');
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_wallets_balance_micro ON wallets(balance_micro);
      `);
      console.log('✅ Added balance_micro index');
    } catch (err) {
      console.log('⚠️ balance_micro index error:', err.message);
    }

    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_wallets_held_micro ON wallets(held_micro);
      `);
      console.log('✅ Added held_micro index');
    } catch (err) {
      console.log('⚠️ held_micro index error:', err.message);
    }

    // Verify final structure
    console.log('\n📋 FINAL WALLET TABLE STRUCTURE:');
    const [finalResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position;
    `);

    finalResults.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Test wallet creation
    console.log('\n🧪 TESTING WALLET CREATION...');
    try {
      const testWallet = await sequelize.query(`
        INSERT INTO wallets (id, user_id, balance_micro, held_micro, confirmed_points, pending_points)
        VALUES (gen_random_uuid(), gen_random_uuid(), 0, 0, 0, 0)
        RETURNING id, user_id, balance_micro, held_micro, confirmed_points, pending_points;
      `);
      console.log('✅ Test wallet creation successful');
      console.log('   Test wallet:', testWallet[0][0]);
      
      // Clean up test wallet
      await sequelize.query(`
        DELETE FROM wallets WHERE id = '${testWallet[0][0].id}';
      `);
      console.log('✅ Test wallet cleaned up');
    } catch (err) {
      console.log('❌ Test wallet creation failed:', err.message);
    }

    console.log('\n🎉 WALLET SCHEMA FORCE FIX COMPLETED!');
    console.log('✅ All required columns should now exist');
    console.log('✅ Registration and OTP verification should work');

  } catch (error) {
    console.error('❌ Error force fixing wallet schema:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the force fix
if (require.main === module) {
  forceFixWalletSchema()
    .then(() => {
      console.log('🎉 Force fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Force fix failed:', error);
      process.exit(1);
    });
}

module.exports = { forceFixWalletSchema };
