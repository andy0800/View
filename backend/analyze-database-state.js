#!/usr/bin/env node
// Analyze current database state before clearing

const { sequelize, Transaction, Wallet, CompanyWallet, User, PurchasedPackage, Ad } = require('./src/models');

async function analyzeDatabaseState() {
  try {
    console.log('🔍 Analyzing current database state...\n');
    
    // 1. Count all transactions
    const transactionCount = await Transaction.count();
    console.log(`📊 Total Transactions: ${transactionCount}`);
    
    if (transactionCount > 0) {
      const transactionTypes = await Transaction.findAll({
        attributes: ['type'],
        group: ['type']
      });
      console.log('   Transaction Types:', transactionTypes.map(t => t.type).join(', '));
    }
    
    // 2. Check all wallets
    const wallets = await Wallet.findAll();
    console.log(`\n💰 User Wallets: ${wallets.length}`);
    
    for (const wallet of wallets) {
      const user = await User.findByPk(wallet.user_id);
      console.log(`   - ${user?.phone || 'Unknown'} (${user?.role || 'Unknown'}): ${wallet.balance_micro} micro units = ${(wallet.balance_micro / 1_000_000).toFixed(6)} KWD`);
    }
    
    // 3. Check company wallet
    const companyWallet = await CompanyWallet.findOne();
    if (companyWallet) {
      console.log(`\n🏢 Company Wallet:`);
      console.log(`   - Balance: ${companyWallet.balance} micro units = ${(companyWallet.balance / 1_000_000).toFixed(6)} KWD`);
      console.log(`   - Total Earnings: ${companyWallet.total_earnings || 0} micro units = ${((companyWallet.total_earnings || 0) / 1_000_000).toFixed(6)} KWD`);
    } else {
      console.log('\n🏢 Company Wallet: Not found');
    }
    
    // 4. Find advertiser +96550000000 and analyze their packages/ads
    const targetAdvertiser = await User.findOne({
      where: { phone: '+96550000000' }
    });
    
    if (targetAdvertiser) {
      const targetWallet = await Wallet.findOne({ where: { user_id: targetAdvertiser.id } });
      console.log(`\n🎯 Target Advertiser +96550000000:`);
      console.log(`   - ID: ${targetAdvertiser.id}`);
      console.log(`   - Role: ${targetAdvertiser.role}`);
      console.log(`   - Current Balance: ${targetWallet?.balance_micro || 0} micro units = ${((targetWallet?.balance_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      
      // Check purchased packages
      const purchasedPackages = await PurchasedPackage.findAll({
        where: { advertiser_id: targetAdvertiser.id }
      });
      console.log(`   - Purchased Packages: ${purchasedPackages.length}`);
      purchasedPackages.forEach(pkg => {
        console.log(`     * Package ${pkg.package_id}: ${pkg.purchased_budget} KWD budget, ${pkg.remaining_budget} KWD remaining, Status: ${pkg.status}`);
      });
      
      // Check ads
      const ads = await Ad.findAll({
        where: { advertiserId: targetAdvertiser.id }
      });
      console.log(`   - Ads: ${ads.length}`);
      ads.forEach(ad => {
        console.log(`     * "${ad.title}": Status: ${ad.status}, Verification: ${ad.verification_status}`);
      });
    } else {
      console.log('\n❌ Target Advertiser +96550000000: Not found');
    }
    
    console.log('\n📋 UPDATED CLEARING PLAN:');
    console.log('   ❌ Clear ALL transactions (reset to 0)');
    console.log('   ❌ Clear ALL user wallet balances (reset to 0)');
    console.log('   ❌ Clear company wallet balance (reset to 0)');
    console.log('   ❌ WIPE OUT ALL purchased packages by advertiser +96550000000');
    console.log('   ❌ WIPE OUT ALL ads by advertiser +96550000000');
    console.log('   ✅ PRESERVE: Advertiser +96550000000 user account and wallet structure (but set balance to 0)');
    console.log('   ✅ PRESERVE: All other user accounts and wallet structures');
    console.log('   ✅ PRESERVE: All ad package definitions (P10, P15, P20, P30)');
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  } finally {
    await sequelize.close();
  }
}

analyzeDatabaseState();
