// backend/scripts/check-database-schema.js
require('dotenv').config();
const { sequelize } = require('../src/models');

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if company_wallets table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_wallets'
    `);
    
    if (results.length === 0) {
      console.log('❌ company_wallets table does not exist');
      return;
    }
    
    console.log('✅ company_wallets table exists');
    
    // Check current columns in company_wallets table
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
    
    // Check if wallet_type column exists
    const hasWalletType = columns.some(col => col.column_name === 'wallet_type');
    console.log(`\n🔍 wallet_type column exists: ${hasWalletType ? '✅ YES' : '❌ NO'}`);
    
    if (!hasWalletType) {
      console.log('\n⚠️ ISSUE IDENTIFIED:');
      console.log('   The CompanyWallet model expects a wallet_type column, but it doesn\'t exist in the database.');
      console.log('   This is causing the "column wallet_type does not exist" error.');
      console.log('\n🔧 SOLUTION:');
      console.log('   Run the migration: 20250101-create-admin-settings-and-notifications.js');
      console.log('   This migration will add the missing wallet_type column and other required columns.');
    }
    
    // Check other required columns
    const requiredColumns = [
      'name', 'held_micro', 'total_earnings_micro', 'total_video_views',
      'total_company_fees_micro', 'total_viewer_rewards_paid_micro',
      'total_ad_spending_micro', 'description'
    ];
    
    console.log('\n🔍 Checking other required columns:');
    requiredColumns.forEach(colName => {
      const exists = columns.some(col => col.column_name === colName);
      console.log(`   • ${colName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

if (require.main === module) {
  checkDatabaseSchema();
}

module.exports = checkDatabaseSchema;
