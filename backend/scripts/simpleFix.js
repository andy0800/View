const { Client } = require('pg');

async function fixDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'adrewards'
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Add the missing column
    console.log('📝 Adding commercial_registration_number column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS commercial_registration_number VARCHAR(255)
    `);
    console.log('✅ Column added');

    // Update the advertiser with fake data
    console.log('📝 Updating advertiser data...');
    const result = await client.query(`
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
      RETURNING id, phone, company_name, license_number, commercial_registration_number, signatory_name
    `);

    if (result.rows.length > 0) {
      console.log('✅ Advertiser updated successfully:', result.rows[0]);
    } else {
      console.log('⚠️ No user found with phone +96550000000');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

fixDatabase();
