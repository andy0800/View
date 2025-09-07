// backend/scripts/fix-company-wallet-schema.js
require('dotenv').config();
const { sequelize } = require('../src/models');

async function fixCompanyWalletSchema() {
  try {
    console.log('🔧 Fixing Company Wallet Database Schema...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check current schema
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'company_wallets'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current company_wallets table columns:');
    columns.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    // Add name column (rename company_name to name for consistency)
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT 'Main Company Wallet'
      `);
      console.log('✅ Added name column');
    } catch (err) {
      console.log('⚠️ name column already exists or error:', err.message);
    }
    
    // Add held_micro column
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS held_micro BIGINT DEFAULT 0
      `);
      console.log('✅ Added held_micro column');
    } catch (err) {
      console.log('⚠️ held_micro column already exists or error:', err.message);
    }
    
    // Add total_earnings_micro column (rename total_earnings to total_earnings_micro)
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS total_earnings_micro BIGINT DEFAULT 0
      `);
      console.log('✅ Added total_earnings_micro column');
    } catch (err) {
      console.log('⚠️ total_earnings_micro column already exists or error:', err.message);
    }
    
    // Add total_company_fees_micro column
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS total_company_fees_micro BIGINT DEFAULT 0
      `);
      console.log('✅ Added total_company_fees_micro column');
    } catch (err) {
      console.log('⚠️ total_company_fees_micro column already exists or error:', err.message);
    }
    
    // Add total_viewer_rewards_paid_micro column
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS total_viewer_rewards_paid_micro BIGINT DEFAULT 0
      `);
      console.log('✅ Added total_viewer_rewards_paid_micro column');
    } catch (err) {
      console.log('⚠️ total_viewer_rewards_paid_micro column already exists or error:', err.message);
    }
    
    // Add total_ad_spending_micro column
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS total_ad_spending_micro BIGINT DEFAULT 0
      `);
      console.log('✅ Added total_ad_spending_micro column');
    } catch (err) {
      console.log('⚠️ total_ad_spending_micro column already exists or error:', err.message);
    }
    
    // Add wallet_type column
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'main' CHECK (wallet_type IN ('main', 'reserve', 'operational'))
      `);
      console.log('✅ Added wallet_type column');
    } catch (err) {
      console.log('⚠️ wallet_type column already exists or error:', err.message);
    }
    
    // Add description column
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS description TEXT
      `);
      console.log('✅ Added description column');
    } catch (err) {
      console.log('⚠️ description column already exists or error:', err.message);
    }
    
    // Add balance_micro column (rename balance to balance_micro for consistency)
    try {
      await sequelize.query(`
        ALTER TABLE company_wallets 
        ADD COLUMN IF NOT EXISTS balance_micro BIGINT DEFAULT 0
      `);
      console.log('✅ Added balance_micro column');
    } catch (err) {
      console.log('⚠️ balance_micro column already exists or error:', err.message);
    }
    
    // Update existing data to populate new columns
    console.log('\n🔄 Updating existing data...');
    
    try {
      await sequelize.query(`
        UPDATE company_wallets 
        SET 
          name = COALESCE(name, company_name),
          balance_micro = COALESCE(balance_micro, balance),
          total_earnings_micro = COALESCE(total_earnings_micro, total_earnings),
          wallet_type = COALESCE(wallet_type, 'main'),
          description = COALESCE(description, 'Company wallet for VIEW app operations')
        WHERE id IS NOT NULL
      `);
      console.log('✅ Updated existing data');
    } catch (err) {
      console.log('⚠️ Error updating existing data:', err.message);
    }
    
    // Add indexes
    console.log('\n🔧 Adding indexes...');
    
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_company_wallets_is_active ON company_wallets(is_active)
      `);
      console.log('✅ Added is_active index');
    } catch (err) {
      console.log('⚠️ is_active index already exists or error:', err.message);
    }
    
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_company_wallets_wallet_type ON company_wallets(wallet_type)
      `);
      console.log('✅ Added wallet_type index');
    } catch (err) {
      console.log('⚠️ wallet_type index already exists or error:', err.message);
    }
    
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_company_wallets_balance_micro ON company_wallets(balance_micro)
      `);
      console.log('✅ Added balance_micro index');
    } catch (err) {
      console.log('⚠️ balance_micro index already exists or error:', err.message);
    }
    
    // Verify final schema
    console.log('\n🔍 Verifying final schema...');
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'company_wallets'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final company_wallets table columns:');
    finalColumns.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🎉 Company Wallet Schema Fix Complete!');
    console.log('\n📋 What was added:');
    console.log('   • name: Wallet name for identification');
    console.log('   • held_micro: Held balance for pending transactions');
    console.log('   • total_earnings_micro: Total earnings in micro units');
    console.log('   • total_company_fees_micro: Total company fees collected');
    console.log('   • total_viewer_rewards_paid_micro: Total viewer rewards paid');
    console.log('   • total_ad_spending_micro: Total ad spending tracked');
    console.log('   • wallet_type: Type of company wallet (main, reserve, operational)');
    console.log('   • description: Additional description of the wallet');
    console.log('   • balance_micro: Current balance in micro units');
    console.log('   • Proper indexes for performance');
    
  } catch (error) {
    console.error('❌ Error fixing company wallet schema:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

if (require.main === module) {
  fixCompanyWalletSchema();
}

module.exports = fixCompanyWalletSchema;
