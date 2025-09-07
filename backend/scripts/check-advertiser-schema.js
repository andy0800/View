const { sequelize } = require('../src/models');

async function checkAdvertiserSchema() {
  try {
    console.log('🔍 Checking advertiser-related table schemas...');
    
    // Check users table structure
    console.log('\n👥 Users table structure:');
    const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    userColumns.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check advertiser_packages table structure
    console.log('\n📦 Advertiser Packages table structure:');
    const [packageColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'advertiser_packages' 
      ORDER BY ordinal_position
    `);
    packageColumns.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check ads table structure
    console.log('\n📺 Ads table structure:');
    const [adColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ads' 
      ORDER BY ordinal_position
    `);
    adColumns.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check wallets table structure
    console.log('\n💰 Wallets table structure:');
    const [walletColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
      ORDER BY ordinal_position
    `);
    walletColumns.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check purchased_packages table structure
    console.log('\n🛒 Purchased Packages table structure:');
    const [purchasedColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'purchased_packages' 
      ORDER BY ordinal_position
    `);
    purchasedColumns.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking advertiser schema:', error);
  } finally {
    await sequelize.close();
  }
}

checkAdvertiserSchema();
