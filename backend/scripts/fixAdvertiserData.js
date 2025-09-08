const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'viewapp_postgres',
  process.env.DB_USER || 'viewapp_postgres_user',
  process.env.DB_PASS || 'Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function fixAdvertiserData() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'commercial_registration_number'
    `);

    if (results.length === 0) {
      console.log('📝 Adding commercial_registration_number column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN commercial_registration_number VARCHAR(255)
      `);
      console.log('✅ Column added successfully');
    } else {
      console.log('✅ Column already exists');
    }

    // Find the advertiser with phone +96550000000
    console.log('🔍 Finding advertiser with phone +96550000000...');
    const [advertiser] = await sequelize.query(`
      SELECT id, phone, role, company_name, license_number, signatory_name
      FROM users 
      WHERE phone = '+96550000000'
    `);

    if (advertiser.length === 0) {
      console.log('❌ No user found with phone +96550000000');
      return;
    }

    const user = advertiser[0];
    console.log('✅ Found user:', user);

    // Update with fake data
    console.log('📝 Updating advertiser with fake data...');
    await sequelize.query(`
      UPDATE users 
      SET 
        company_name = 'Fake Company Ltd.',
        license_number = 'LIC-2024-001',
        commercial_registration_number = 'CR-2024-001',
        signatory_name = 'John Doe',
        role = 'advertiser',
        kyc_status = 'verified',
        is_active = true,
        verified_at = NOW(),
        verified_by = NULL
      WHERE phone = '+96550000000'
    `);

    console.log('✅ Advertiser data updated successfully');

    // Verify the update
    const [updatedUser] = await sequelize.query(`
      SELECT id, phone, role, company_name, license_number, commercial_registration_number, signatory_name, kyc_status
      FROM users 
      WHERE phone = '+96550000000'
    `);

    console.log('📊 Updated user data:', updatedUser[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
fixAdvertiserData();
