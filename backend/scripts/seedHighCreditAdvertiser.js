// backend/scripts/seedHighCreditAdvertiser.js

const path = require('path');
const modelsPath = path.join(__dirname, '..','src', 'models', 'index.js');
const { sequelize, User, Wallet } = require('../src/models');
const bcrypt = require('bcrypt');
const { validateAndConvertToFils, filsToKwd } = require('../src/utils/currencyUtils');

async function seed() {
  try {
    // 1. Log the active DB connection
    console.log(
      '🔍 Connecting to:',
      sequelize.config.database,
      '@',
      sequelize.config.host,
      `(env=${process.env.NODE_ENV || 'development'})`
    );

    // 2. Authenticate & set public schema
    await sequelize.authenticate();
    console.log('▶️ Database connected');
    await sequelize.query('SET search_path TO public;');
    await sequelize.sync({ alter: true });
console.log('🛠 Tables synced via sequelize.sync()');

    // 3. findOrCreate user by phone
    const phone = '88888888';
    const [user, userCreated] = await User.findOrCreate({
      where: { phone },
      defaults: {
        name: 'High Credit Advertiser',
        civil_id: '000000000000',
        role: 'advertiser',
        kyc_status: 'verified',
        company_name: 'Acme Corp',
        license_number: 'LIC-000000',
      },
    });
    console.log(`🔹 User ${phone} ${userCreated ? 'created' : 'found'} (id=${user.id})`);

    // 4. findOrCreate wallet
    const [wallet, walletCreated] = await Wallet.findOrCreate({
      where: { user_id: user.id },
      defaults: { balance: 0 },
    });
    console.log(`🔹 Wallet ${wallet.id} ${walletCreated ? 'created' : 'found'}`);

    // 5. Set huge balance (convert KWD to fils for storage)
    const creditAmountKWD = 1_000_000; // 1 million KWD
    const creditAmountInFils = validateAndConvertToFils(creditAmountKWD);
    wallet.balance = (wallet.balance || 0) + creditAmountInFils;
    await wallet.save();
    console.log(`✅ Wallet ${wallet.id} balance is now ${filsToKwd(wallet.balance)} KWD (${wallet.balance} fils)`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();