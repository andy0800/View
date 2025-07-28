// backend/scripts/seedDummyAdvertiser.js

/**
 * Seeds one advertiser user (phone=99999999) with kyc_status='verified'
 * and a Wallet balance of 600 (KD). Safe to run multiple times.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize, User, Wallet } = require('../src/models');

async function seed() {
  await sequelize.authenticate();
  console.log('▶️ Database connected');

  // 1) Create or update the advertiser
  const [adv, created] = await User.findOrCreate({
    where: { phone: '99999999' },
    defaults: {
      name:           'Test Advertiser',
      phone:          '99999999',
      civil_id:       'CIVIL123456',
      role:           'advertiser',
      company_name:   'ACME Testing Co.',
      license_number: 'LIC-000123',
      signatory_name: 'Jane Doe',
      kyc_status:     'verified'
    }
  });

  if (!created) {
    adv.kyc_status = 'verified';
    await adv.save();
  }

  console.log(`✅ Advertiser user ${created ? 'created' : 'updated'}:`, {
    id: adv.id,
    phone: adv.phone,
    kyc_status: adv.kyc_status
  });

  // 2) Create or update their wallet with 600 KD
  //    Wallet model uses `user_id` foreign key column
  let wallet = await Wallet.findOne({
    where: { user_id: adv.id }
  });

  if (!wallet) {
    wallet = await Wallet.create({
      user_id: adv.id,
      balance: 600
    });
    console.log('💰 Wallet created:', { user_id: adv.id, balance: wallet.balance });
  } else {
    wallet.balance = 600;
    await wallet.save();
    console.log('💰 Wallet updated:', { user_id: adv.id, balance: wallet.balance });
  }

  console.log('🎉 Seeding complete. OTP-login as 99999999 to test.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});