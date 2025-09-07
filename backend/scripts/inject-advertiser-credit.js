// Inject 1,000,000 KWD to advertiser account
// This script adds credit to the advertiser wallet

const { sequelize, Wallet, Transaction, User } = require('../src/models');

async function injectAdvertiserCredit() {
  try {
    console.log('🚀 Starting credit injection...');
    
    // Find the advertiser by phone number
    const advertiser = await User.findOne({
      where: { phone: '+96550000000' }
    });

    if (!advertiser) {
      console.error('❌ Advertiser not found with phone: +96550000000');
      return;
    }

    console.log('✅ Found advertiser:', advertiser.id);

    // Get or create wallet
    let wallet = await Wallet.findByUserId(advertiser.id);
    if (!wallet) {
      wallet = await Wallet.createForUser(advertiser.id);
      console.log('✅ Created new wallet for advertiser');
    } else {
      console.log('✅ Found existing wallet');
    }

    // Credit amount in KWD and micro units
    const creditKWD = 1_000_000;
    const creditMicro = 1_000_000_000_000; // 1 trillion micro units

    console.log(`💰 Injecting ${creditKWD.toLocaleString()} KWD (${creditMicro.toLocaleString()} micro units)`);

    // Start database transaction
    const transaction = await sequelize.transaction();

    try {
      // Add credit to wallet
      await wallet.addBalance(creditMicro, transaction);

      // Create transaction record using direct SQL to handle the 'amount' column
      await sequelize.query(`
        INSERT INTO transactions (
          id, from_wallet_id, to_wallet_id, type, amount, amount_micro, 
          reference, transaction_category, status, meta, created_at, updated_at
        ) VALUES (
          :id, :from_wallet_id, :to_wallet_id, :type, :amount, :amount_micro,
          :reference, :transaction_category, :status, :meta, :created_at, :updated_at
        )
      `, {
        replacements: {
          id: require('crypto').randomUUID(),
          from_wallet_id: null,
          to_wallet_id: wallet.id,
          type: 'deposit',
          amount: creditMicro,
          amount_micro: creditMicro,
          reference: 'SYSTEM_CREDIT_INJECTION',
          transaction_category: 'deposit',
          status: 'completed',
          meta: JSON.stringify({
            reason: 'Initial credit injection for testing',
            amountKWD: creditKWD,
            injectedBy: 'system_script'
          }),
          created_at: new Date(),
          updated_at: new Date()
        },
        transaction
      });

      // Commit transaction
      await transaction.commit();

      // Refresh wallet data
      await wallet.reload();

      console.log('✅ Credit injection successful!');
      console.log('📊 New wallet balance:');
      console.log(`   - KWD: ${wallet.getBalanceKWD().toLocaleString()}`);
      console.log(`   - Micro: ${wallet.balance_micro.toLocaleString()}`);
      console.log(`   - Available: ${wallet.getAvailableBalanceKWD().toLocaleString()} KWD`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error injecting credit:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
injectAdvertiserCredit();
