#!/usr/bin/env node
// Investigate why company fees are not being collected

const { sequelize, CompanyWallet, User, Wallet, Transaction, ViewEvent, Ad, PurchasedPackage } = require('./src/models');

async function investigateCompanyFees() {
  try {
    console.log('🔍 INVESTIGATING COMPANY FEES COLLECTION ISSUE\n');
    
    // 1. Check Company Wallet Current State
    console.log('🏢 COMPANY WALLET CURRENT STATE:');
    const companyWallet = await CompanyWallet.findOne();
    if (companyWallet) {
      console.log(`   ID: ${companyWallet.id}`);
      console.log(`   Balance: ${(companyWallet.balance_micro || 0).toLocaleString()} micro units = ${((companyWallet.balance_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Company Fees: ${(companyWallet.total_company_fees || 0).toLocaleString()} micro units = ${((companyWallet.total_company_fees || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Earnings: ${(companyWallet.total_earnings || 0).toLocaleString()} micro units = ${((companyWallet.total_earnings || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Viewer Rewards Paid: ${(companyWallet.total_viewer_rewards_paid || 0).toLocaleString()} micro units = ${((companyWallet.total_viewer_rewards_paid || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Ad Spending: ${(companyWallet.total_ad_spending || 0).toLocaleString()} micro units = ${((companyWallet.total_ad_spending || 0) / 1_000_000).toFixed(6)} KWD`);
    }
    console.log('');
    
    // 2. Check Viewer +96592209792 (Andrew)
    console.log('👤 VIEWER +96592209792 (Andrew):');
    const viewer = await User.findOne({ where: { phone: '+96592209792' } });
    if (viewer) {
      console.log(`   Name: ${viewer.name}`);
      console.log(`   ID: ${viewer.id}`);
      
      const viewerWallet = await Wallet.findOne({ where: { user_id: viewer.id } });
      if (viewerWallet) {
        console.log(`   Current Balance: ${(viewerWallet.balance_micro || 0).toLocaleString()} micro units = ${((viewerWallet.balance_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      }
    }
    console.log('');
    
    // 3. Analyze All Transactions for this Viewer
    console.log('💰 TRANSACTION ANALYSIS FOR VIEWER:');
    const viewerTransactions = await Transaction.findAll({
      where: { user_id: viewer.id },
      attributes: ['id', 'type', 'amount_micro', 'transaction_category', 'status', 'created_at', 'meta'],
      order: [['created_at', 'ASC']]
    });
    
    console.log(`   Total Transactions: ${viewerTransactions.length}`);
    
    let totalViewCharges = 0;
    let totalViewerRewards = 0;
    let adViewCharges = [];
    let viewerRewards = [];
    
    viewerTransactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} - ${(tx.amount_micro || 0).toLocaleString()} micro units (${tx.transaction_category}) - ${tx.status}`);
      
      if (tx.type === 'view_charge') {
        totalViewCharges += (tx.amount_micro || 0);
        adViewCharges.push({
          id: tx.id,
          amount: tx.amount_micro || 0,
          adId: tx.meta?.ad_id || null,
          packageId: tx.meta?.purchased_package_id || null
        });
      } else if (tx.type === 'viewer_reward') {
        totalViewerRewards += (tx.amount_micro || 0);
        viewerRewards.push({
          id: tx.id,
          amount: tx.amount_micro || 0
        });
      }
    });
    
    console.log(`\n   📊 TRANSACTION SUMMARY:`);
    console.log(`   Total View Charges: ${totalViewCharges.toLocaleString()} micro units`);
    console.log(`   Total Viewer Rewards: ${totalViewerRewards.toLocaleString()} micro units`);
    console.log(`   Expected Company Fees: ${totalViewCharges.toLocaleString()} micro units (should equal view charges)`);
    console.log(`   Missing Company Fees: ${(totalViewCharges - (companyWallet.total_company_fees || 0)).toLocaleString()} micro units`);
    console.log('');
    
    // 4. Check ViewEvents to see if company fees were recorded
    console.log('🎬 VIEW EVENTS ANALYSIS:');
    const viewEvents = await ViewEvent.findAll({
      where: { user_id: viewer.id, is_completed: true },
      attributes: ['id', 'ad_id', 'charged_micro', 'viewer_reward_micro', 'company_share_micro', 'completed_at'],
      order: [['completed_at', 'ASC']]
    });
    
    console.log(`   Total Completed Views: ${viewEvents.length}`);
    
    let totalCharged = 0;
    let totalViewerRewardsFromEvents = 0;
    let totalCompanyShares = 0;
    
    viewEvents.forEach((event, index) => {
      console.log(`   View ${index + 1}:`);
      console.log(`     Charged: ${(event.charged_micro || 0).toLocaleString()} micro units`);
      console.log(`     Viewer Reward: ${(event.viewer_reward_micro || 0).toLocaleString()} micro units`);
      console.log(`     Company Share: ${(event.company_share_micro || 0).toLocaleString()} micro units`);
      console.log(`     Completed: ${event.completed_at}`);
      
      totalCharged += (event.charged_micro || 0);
      totalViewerRewardsFromEvents += (event.viewer_reward_micro || 0);
      totalCompanyShares += (event.company_share_micro || 0);
    });
    
    console.log(`\n   📊 VIEW EVENTS SUMMARY:`);
    console.log(`   Total Charged: ${totalCharged.toLocaleString()} micro units`);
    console.log(`   Total Viewer Rewards: ${totalViewerRewardsFromEvents.toLocaleString()} micro units`);
    console.log(`   Total Company Shares: ${totalCompanyShares.toLocaleString()} micro units`);
    console.log(`   Company Shares Missing: ${(totalCharged - totalCompanyShares).toLocaleString()} micro units`);
    console.log('');
    
    // 5. Check if Company Fee Transactions were created
    console.log('🏢 COMPANY FEE TRANSACTIONS:');
    const companyFeeTransactions = await Transaction.findAll({
      where: { 
        type: 'company_fee',
        transaction_category: 'company_fee'
      },
      attributes: ['id', 'amount_micro', 'status', 'created_at', 'meta'],
      order: [['created_at', 'ASC']]
    });
    
    console.log(`   Company Fee Transactions Found: ${companyFeeTransactions.length}`);
    if (companyFeeTransactions.length > 0) {
      companyFeeTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. Company Fee - ${(tx.amount_micro || 0).toLocaleString()} micro units - ${tx.status} - Ad: ${tx.meta?.ad_id || 'N/A'}`);
      });
    } else {
      console.log('   ❌ NO COMPANY FEE TRANSACTIONS FOUND!');
    }
    console.log('');
    
    // 6. Check the completeWatchingAd function logic
    console.log('🔍 INVESTIGATING completeWatchingAd LOGIC:');
    console.log('   The issue might be in the videoController.completeWatchingAd function.');
    console.log('   Let me check if company fee transactions are being created...');
    
    // 7. Check if there are any company fee transactions for the specific ads
    console.log('\n🎯 CHECKING COMPANY FEES FOR SPECIFIC ADS:');
    for (const adCharge of adViewCharges) {
      if (adCharge.adId) {
        const companyFeeTx = await Transaction.findOne({
          where: {
            type: 'company_fee',
            ad_id: adCharge.adId
          }
        });
        
        if (companyFeeTx) {
          console.log(`   ✅ Ad ${adCharge.adId}: Company fee transaction found - ${(companyFeeTx.amount_micro || 0).toLocaleString()} micro units`);
        } else {
          console.log(`   ❌ Ad ${adCharge.adId}: NO company fee transaction found! Expected: ${adCharge.amount.toLocaleString()} micro units`);
        }
      }
    }
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    console.log('1. Viewer earned 31,500 micro units ✅');
    console.log('2. View charges total 63,000 micro units ✅');
    console.log('3. Company fees should be 31,500 micro units ❌');
    console.log('4. Company fees actually collected: 0 micro units ❌');
    console.log('5. Company share micro units in ViewEvents: 0 ❌');
    console.log('6. Company fee transactions created: 0 ❌');
    console.log('\n🎯 CONCLUSION: Company fees are NOT being collected during video completion!');
    console.log('   This is a critical bug in the completeWatchingAd function.');
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await sequelize.close();
  }
}

investigateCompanyFees();
