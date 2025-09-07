// backend/scripts/testAdvertiserCreditAPI.js
const { sequelize, User, Wallet, Transaction } = require('../src/models');

async function testAdvertiserCreditAPI() {
  try {
    console.log('🔍 Testing advertiser credit API endpoint directly');
    
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
    
    // Simulate the API response
    const apiResponse = {
      balance: wallet.balance / 1000 // Convert to KWD
    };
    
    console.log('📡 API Response (what frontend receives):', apiResponse);
    console.log('✅ This should show the correct balance in KWD');
    
  } catch (error) {
    console.error('❌ Error testing advertiser credit API:', error);
  } finally {
    await sequelize.close();
  }
}

testAdvertiserCreditAPI();
