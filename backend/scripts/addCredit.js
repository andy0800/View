#!/usr/bin/env node

// 1) Load .env from the backend folder
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 2) Import your Sequelize setup + models
const db = require(path.join(__dirname, '../src/models'));
const { sequelize, User, Wallet } = db;

// 3) Sanity‐check exports
if (!sequelize || !User || !Wallet) {
  console.error(
    '❌ Invalid db export, expected sequelize/User/Wallet but got:',
    Object.keys(db)
  );
  process.exit(1);
}

// 4) Parse & validate CLI arguments
const [ , , phone, amt ] = process.argv;
if (!phone || !amt) {
  console.error('Usage: node addCredit.js <phone> <amount>');
  process.exit(1);
}
const amount = parseFloat(amt);
if (isNaN(amount)) {
  console.error('❌ <amount> must be a valid number');
  process.exit(1);
}

(async () => {
  try {
    // 5) Connect and ensure we use the public schema
    await sequelize.authenticate();
    await sequelize.query('SET search_path TO public;');
    console.log(`✅ Connected to DB '${process.env.DB_NAME}'`);

    // 6) Find the advertiser by phone
    const advertiser = await User.findOne({ where: { phone } });
    if (!advertiser) {
      throw new Error(`Advertiser with phone='${phone}' not found`);
    }
    console.log(`👤 Advertiser ID: ${advertiser.id}`);

    // 7) Find or create their wallet
    let wallet = await Wallet.findOne({ where: { user_id: advertiser.id } });
    if (!wallet) {
      console.log('➕ No wallet found—creating a new one with zero balance');
      wallet = await Wallet.create({
        user_id: advertiser.id,
        balance: 0
      });
    }

    // 8) Credit the wallet and persist
    wallet.balance += amount;
    await wallet.save();

    console.log(`💰 New balance for ${phone}: ${wallet.balance} KD`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
})();