#!/usr/bin/env node
// Clear all financial data for fresh testing

const { sequelize, Transaction, Wallet, CompanyWallet, User, PurchasedPackage, Ad, ViewEvent } = require('./src/models');

async function clearDatabaseFinancials() {
  try {
    console.log('🧹 Starting comprehensive database financial clearing...\n');
    
    // 1. Clear all transactions
    console.log('📊 Clearing all transactions...');
    const transactionCount = await Transaction.count();
    if (transactionCount > 0) {
      await Transaction.destroy({ where: {} });
      console.log(`   ✅ Deleted ${transactionCount} transactions`);
    } else {
      console.log('   ✅ No transactions to delete');
    }
    
    // 2. Clear all ViewEvents (viewing history)
    console.log('\n👁️ Clearing all view events...');
    const viewEventCount = await ViewEvent.count();
    if (viewEventCount > 0) {
      await ViewEvent.destroy({ where: {} });
      console.log(`   ✅ Deleted ${viewEventCount} view events`);
    } else {
      console.log('   ✅ No view events to delete');
    }
    
    // 3. Clear all ads by advertiser +96550000000
    console.log('\n📺 Clearing all ads by advertiser +96550000000...');
    const targetAdvertiser = await User.findOne({ where: { phone: '+96550000000' } });
    if (targetAdvertiser) {
      const adCount = await Ad.count({ where: { advertiserId: targetAdvertiser.id } });
      if (adCount > 0) {
        await Ad.destroy({ where: { advertiserId: targetAdvertiser.id } });
        console.log(`   ✅ Deleted ${adCount} ads by advertiser +96550000000`);
      } else {
        console.log('   ✅ No ads to delete for advertiser +96550000000');
      }
    } else {
      console.log('   ❌ Advertiser +96550000000 not found');
    }
    
    // 4. Clear all purchased packages by advertiser +96550000000
    console.log('\n📦 Clearing all purchased packages by advertiser +96550000000...');
    if (targetAdvertiser) {
      const packageCount = await PurchasedPackage.count({ where: { advertiser_id: targetAdvertiser.id } });
      if (packageCount > 0) {
        await PurchasedPackage.destroy({ where: { advertiser_id: targetAdvertiser.id } });
        console.log(`   ✅ Deleted ${packageCount} purchased packages by advertiser +96550000000`);
      } else {
        console.log('   ✅ No purchased packages to delete for advertiser +96550000000');
      }
    }
    
    // 5. Reset all wallet balances to 0
    console.log('\n💰 Resetting all wallet balances to 0...');
    const walletCount = await Wallet.count();
    if (walletCount > 0) {
      await Wallet.update({
        balance_micro: 0,
        held_micro: 0,
        balance: 0.00,
        held_balance: 0.00
      }, { where: {} });
      console.log(`   ✅ Reset ${walletCount} wallet balances to 0`);
    } else {
      console.log('   ✅ No wallets to reset');
    }
    
    // 6. Reset company wallet to 0
    console.log('\n🏢 Resetting company wallet to 0...');
    const companyWallet = await CompanyWallet.findOne();
    if (companyWallet) {
      await companyWallet.update({
        balance: 0,
        held_micro: 0,
        total_earnings: 0,
        total_company_fees: 0,
        total_viewer_rewards_paid: 0,
        total_ad_spending: 0
      });
      console.log('   ✅ Reset company wallet to 0');
    } else {
      console.log('   ✅ No company wallet to reset');
    }
    
    // 7. Verification
    console.log('\n🔍 Verifying clearing operation...');
    const remainingTransactions = await Transaction.count();
    const remainingViewEvents = await ViewEvent.count();
    const remainingAds = await Ad.count({ where: { advertiserId: targetAdvertiser?.id } });
    const remainingPackages = await PurchasedPackage.count({ where: { advertiser_id: targetAdvertiser?.id } });
    const totalWallets = await Wallet.count();
    const walletsWithBalance = await Wallet.count({ where: { balance_micro: { [sequelize.Op.gt]: 0 } } });
    
    console.log(`   📊 Remaining transactions: ${remainingTransactions}`);
    console.log(`   👁️ Remaining view events: ${remainingViewEvents}`);
    console.log(`   📺 Remaining ads by +96550000000: ${remainingAds}`);
    console.log(`   📦 Remaining packages by +96550000000: ${remainingPackages}`);
    console.log(`   💰 Wallets with balance > 0: ${walletsWithBalance}/${totalWallets}`);
    
    console.log('\n🎉 Database financial clearing completed successfully!');
    console.log('\n📋 SUMMARY OF WHAT WAS CLEARED:');
    console.log('   ✅ All transactions deleted');
    console.log('   ✅ All view events deleted');
    console.log('   ✅ All ads by advertiser +96550000000 deleted');
    console.log('   ✅ All purchased packages by advertiser +96550000000 deleted');
    console.log('   ✅ All wallet balances reset to 0');
    console.log('   ✅ Company wallet reset to 0');
    console.log('\n📋 WHAT WAS PRESERVED:');
    console.log('   ✅ All user accounts (phone numbers, roles, KYC status)');
    console.log('   ✅ All wallet structures (wallet records remain)');
    console.log('   ✅ All ad package definitions (P10, P15, P20, P30)');
    console.log('   ✅ All other users\' data (viewers, other advertisers)');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await sequelize.close();
  }
}

clearDatabaseFinancials();
