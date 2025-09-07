// backend/scripts/checkUserCredit.js
const { sequelize, User, Wallet } = require('../src/models');
const { filsToKwd } = require('../src/utils/currencyUtils');

async function checkUserCredit() {
  try {
    console.log('🔍 Checking user credit for phone: +96592209794');
    
    // Find user by phone number
    const user = await User.findOne({
      where: { phone: '+96592209794' }
    });
    
    if (!user) {
      console.log('❌ User not found with phone: +96592209794');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    });
    
    // Check wallet balance
    const wallet = await Wallet.findOne({
      where: { user_id: user.id }
    });
    
    if (!wallet) {
      console.log('❌ No wallet found for user');
      return;
    }
    
    console.log('💰 Wallet balance:', {
      balance: wallet.balance,
      balanceInKWD: filsToKwd(wallet.balance)
    });
    
    // Check transactions
    const transactions = await sequelize.models.Transaction.findAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`📊 Found ${transactions.length} transactions:`);
    transactions.forEach(tx => {
      console.log(`  - ${tx.type}: ${tx.amount} (${tx.transaction_category}) - ${tx.reference}`);
    });
    
    // Check if user has purchased any packages
    const packageTransactions = transactions.filter(tx => 
      tx.transaction_category === 'ad_purchase'
    );
    
    if (packageTransactions.length > 0) {
      console.log('📦 Package purchases found:', packageTransactions.length);
      packageTransactions.forEach(tx => {
        console.log(`  - Amount: ${filsToKwd(tx.amount)} KWD`);
      });
    } else {
      console.log('❌ No package purchases found');
    }
    
    // Check if user has any ads
    const ads = await sequelize.models.Ad.findAll({
      where: { advertiser_id: user.id }
    });
    
    console.log(`📺 User has ${ads.length} ads`);
    
  } catch (error) {
    console.error('❌ Error checking user credit:', error);
  } finally {
    await sequelize.close();
  }
}

checkUserCredit();
