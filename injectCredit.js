// injectCredit.js
require('dotenv').config({ path: './backend/.env' });
const { sequelize, Wallet, User } = require('./backend/src/models');

(async () => {
  await sequelize.authenticate();
  console.log('DB connected');

  // 1) Lookup advertiser
  const advertiser = await User.findOne({
    where: { phone: '99999999' }
  });
  if (!advertiser) {
    console.error('Advertiser not found');
    process.exit(1);
  }

  // 2) Find or create wallet
  let wallet = await Wallet.findOne({
    where: { user_id: advertiser.id }
  });
  if (!wallet) {
    wallet = await Wallet.create({
      user_id: advertiser.id,
      balance: 6000
    });
  } else {
    wallet.balance = 6000;
    await wallet.save();
  }

  console.log(`Balance set to ${wallet.balance} KD for ${advertiser.phone}`);
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});