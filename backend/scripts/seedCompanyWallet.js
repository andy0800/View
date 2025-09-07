// backend/scripts/seedCompanyWallet.js
require('dotenv').config();
const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');
const { sequelize, CompanyWallet } = require(modelsPath);

async function seedCompanyWallet() {
  try {
    console.log('🔄 Creating company wallet...');

    // Check if company wallet already exists
    const existingWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });

    if (existingWallet) {
      console.log('⚠️ Company wallet already exists, updating...');
      
      // Update existing wallet
      await existingWallet.update({
        balance: 0, // Start with 0 balance
        total_earnings: 0,
        total_video_views: 0,
        is_active: true
      });
      
      console.log('✅ Company wallet updated successfully');
      console.log(`🆔 ID: ${existingWallet.id}`);
      console.log(`💰 Balance: ${existingWallet.balance} fils`);
      return;
    }

    // Create new company wallet
    const companyWallet = await CompanyWallet.create({
      company_name: 'View App Company',
      balance: 0, // Start with 0 balance
      total_earnings: 0,
      total_video_views: 0,
      is_active: true
    });

    console.log('✅ Company wallet created successfully!');
    console.log(`🆔 ID: ${companyWallet.id}`);
    console.log(`🏢 Company: ${companyWallet.company_name}`);
    console.log(`💰 Balance: ${companyWallet.balance} fils`);
    console.log(`📊 Total Earnings: ${companyWallet.total_earnings} fils`);
    console.log(`👁️ Total Video Views: ${companyWallet.total_video_views}`);

  } catch (error) {
    console.error('❌ Error creating company wallet:', error);
    process.exit(1);
  }
}

// Run the seeder
seedCompanyWallet()
  .then(() => {
    console.log('🎉 Company wallet seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Company wallet seeding failed:', error);
    process.exit(1);
  });
