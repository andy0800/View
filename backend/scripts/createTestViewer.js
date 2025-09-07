// backend/scripts/createTestViewer.js
require('dotenv').config();
const path = require('path');
const modelsPath = path.join(__dirname, '..', 'src', 'models', 'index.js');
const { sequelize, User, Wallet } = require(modelsPath);

async function createTestViewer() {
  try {
    console.log('🔄 Creating test viewer account...');

    // 1. Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 2. Set public schema
    await sequelize.query('SET search_path TO public;');
    console.log('✅ Public schema set');

    // 3. Check if test viewer already exists
    const existingViewer = await User.findOne({
      where: { phone: '+96560000000' }
    });

    if (existingViewer) {
      console.log('✅ Test viewer already exists');
      console.log('🆔 Viewer ID:', existingViewer.id);
      console.log('📱 Phone:', existingViewer.phone);
      console.log('👤 Name:', existingViewer.name);
      console.log('✅ KYC Status:', existingViewer.kyc_status);
      return;
    }

    // 4. Create test viewer account
    const testViewer = await User.create({
      name: 'Test Viewer',
      phone: '+96560000000',
      role: 'viewer',
      kyc_status: 'verified',
      civil_id: '000000000000',
      verified_at: new Date(),
      is_active: true
    });

    // 5. Create viewer wallet
    await Wallet.create({
      user_id: testViewer.id,
      balance: 0.00
    });

    console.log('✅ Test viewer account created successfully!');
    console.log('🆔 Viewer ID:', testViewer.id);
    console.log('📱 Phone:', testViewer.phone);
    console.log('👤 Name:', testViewer.name);
    console.log('✅ KYC Status:', testViewer.kyc_status);
    console.log('💰 Wallet Balance: 0 KWD');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create test viewer:', err);
    console.error('❌ Error stack:', err.stack);
    process.exit(1);
  }
}

// Run the script
createTestViewer();
