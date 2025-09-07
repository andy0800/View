#!/usr/bin/env node
// Verify that all clearing operations were successful

const { sequelize, Transaction, Wallet, CompanyWallet, User, PurchasedPackage, Ad, ViewEvent } = require('./src/models');

async function verifyClearing() {
  try {
    console.log('🔍 Verifying database clearing operation...\n');
    
    // 1. Check transactions
    const transactionCount = await Transaction.count();
    console.log(`📊 Transactions: ${transactionCount} (should be 0)`);
    
    // 2. Check view events
    const viewEventCount = await ViewEvent.count();
    console.log(`👁️ View Events: ${viewEventCount} (should be 0)`);
    
    // 3. Check ads by advertiser +96550000000
    const targetAdvertiser = await User.findOne({ where: { phone: '+96550000000' } });
    if (targetAdvertiser) {
      const adCount = await Ad.count({ where: { advertiserId: targetAdvertiser.id } });
      console.log(`📺 Ads by +96550000000: ${adCount} (should be 0)`);
    }
    
    // 4. Check purchased packages by advertiser +96550000000
    if (targetAdvertiser) {
      const packageCount = await PurchasedPackage.count({ where: { advertiser_id: targetAdvertiser.id } });
      console.log(`📦 Packages by +96550000000: ${packageCount} (should be 0)`);
    }
    
    // 5. Check wallet balances
    const wallets = await Wallet.findAll();
    console.log(`\n💰 Wallet Balances:`);
    let totalWallets = 0;
    let walletsWithBalance = 0;
    
    for (const wallet of wallets) {
      const user = await User.findByPk(wallet.user_id);
      const balance = wallet.balance_micro / 1_000_000;
      console.log(`   - ${user?.phone || 'Unknown'}: ${balance.toFixed(6)} KWD`);
      totalWallets++;
      if (wallet.balance_micro > 0) walletsWithBalance++;
    }
    
    console.log(`\n📊 Summary: ${walletsWithBalance}/${totalWallets} wallets have balance > 0 (should be 0/${totalWallets})`);
    
    // 6. Check company wallet
    const companyWallet = await CompanyWallet.findOne();
    if (companyWallet) {
      const balance = companyWallet.balance / 1_000_000;
      console.log(`🏢 Company Wallet: ${balance.toFixed(6)} KWD (should be 0.000000)`);
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await sequelize.close();
  }
}

verifyClearing();
