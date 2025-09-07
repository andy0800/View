require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create a direct database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'adrewards',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function fixUserData() {
  try {
    console.log('🔍 Connecting to database...');
    console.log('Database config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      database: process.env.DB_NAME || 'adrewards'
    });
    
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Add the missing column if it doesn't exist
    console.log('📝 Adding commercial_registration_number column...');
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN commercial_registration_number VARCHAR(255)
      `);
      console.log('✅ Column added successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Column already exists');
      } else {
        console.log('⚠️ Column add error (continuing):', error.message);
      }
    }

    // Update the advertiser with phone +96550000000
    console.log('📝 Updating advertiser with phone +96550000000...');
    const result = await sequelize.query(`
      UPDATE users 
      SET 
        company_name = 'Fake Company Ltd.',
        license_number = 'LIC-2024-001',
        commercial_registration_number = 'CR-2024-001',
        signatory_name = 'John Doe',
        role = 'advertiser',
        kyc_status = 'verified',
        is_active = true,
        verified_at = NOW()
      WHERE phone = '+96550000000'
      RETURNING id, phone, company_name, license_number, commercial_registration_number, signatory_name, kyc_status
    `);

    if (result[0].length > 0) {
      console.log('✅ Advertiser updated successfully:');
      console.log(JSON.stringify(result[0][0], null, 2));
    } else {
      console.log('⚠️ No user found with phone +96550000000');
      
      // Check what users exist
      const users = await sequelize.query(`
        SELECT id, phone, role, company_name, license_number, kyc_status
        FROM users 
        LIMIT 5
      `);
      console.log('📊 Existing users:', users[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
console.log('🚀 Starting database fix script...');
fixUserData();
