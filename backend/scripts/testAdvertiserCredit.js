// backend/scripts/testAdvertiserCredit.js
const { sequelize, User, Wallet, Transaction } = require('../src/models');

async function testAdvertiserCredit() {
  try {
    console.log('🔍 Testing advertiser credit endpoint logic');
    
    // Find the advertiser user
    const user = await User.findOne({
      where: { phone: '+96592209794' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      role: user.role
    });
    
    // Simulate what the getBalance function does
    let wallet = await Wallet.findOne({ where: { user_id: user.id } });
    
    if (!wallet) {
      console.log('⚠️ Wallet not found, creating new wallet...');
      wallet = await Wallet.create({
        user_id: user.id,
        balance: 0.00,
      });
    }
    
    console.log('💰 Current wallet balance:', {
      balance: wallet.balance,
      balanceInKWD: wallet.balance / 1000
    });
    
    // Check recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log('📊 Recent transactions:');
    recentTransactions.forEach(tx => {
      console.log(`  - ${tx.type}: ${tx.amount} (${tx.transaction_category}) - ${tx.reference}`);
    });
    
    // Calculate what the balance should be
    const totalCredits = recentTransactions
      .filter(tx => tx.type === 'credit' || tx.transaction_category === 'credit_reservation')
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);
    
    const totalDebits = recentTransactions
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);
    
    console.log('🧮 Balance calculation:');
    console.log(`  - Total credits: ${totalCredits / 1000} KWD`);
    console.log(`  - Total debits: ${totalDebits / 1000} KWD`);
    console.log(`  - Net balance: ${(totalCredits - totalDebits) / 1000} KWD`);
    
  } catch (error) {
    console.error('❌ Error testing advertiser credit:', error);
  } finally {
    await sequelize.close();
  }
}

testAdvertiserCredit();
