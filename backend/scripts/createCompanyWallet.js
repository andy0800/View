// backend/scripts/createCompanyWallet.js
require('dotenv').config();
const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');
const { sequelize, CompanyWallet } = require(modelsPath);

async function createCompanyWallet() {
  try {
    console.log('🔄 Creating company wallet...');

    // 1. Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 2. Set public schema
    await sequelize.query('SET search_path TO public;');
    console.log('✅ Public schema set');

    // 3. Check if company wallet already exists
    const existingWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });

    if (existingWallet) {
      console.log('✅ Company wallet already exists');
      console.log('📊 Current balance:', existingWallet.balance / 1000, 'KWD');
      console.log('💰 Total earnings:', existingWallet.total_earnings / 1000, 'KWD');
      console.log('👁️ Total video views:', existingWallet.total_video_views);
      return;
    }

    // 4. Create company wallet
    const companyWallet = await CompanyWallet.create({
      company_name: 'View App Company',
      balance: 0, // Start with 0 balance
      total_earnings: 0,
      total_video_views: 0,
      is_active: true
    });

    console.log('✅ Company wallet created successfully!');
    console.log('🆔 Wallet ID:', companyWallet.id);
    console.log('🏢 Company Name:', companyWallet.company_name);
    console.log('💰 Initial Balance: 0 KWD');
    console.log('📊 Total Earnings: 0 KWD');
    console.log('👁️ Total Video Views: 0');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create company wallet:', err);
    console.error('❌ Error stack:', err.stack);
    process.exit(1);
  }
}

// Run the script
createCompanyWallet();
