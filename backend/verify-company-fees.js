#!/usr/bin/env node
// Verify company fees are being collected correctly

const { sequelize, CompanyWallet } = require('./src/models');

async function verifyCompanyFees() {
  try {
    console.log('🔍 VERIFYING COMPANY FEES COLLECTION\n');
    
    const companyWallet = await CompanyWallet.findOne();
    if (companyWallet) {
      console.log('🏢 COMPANY WALLET:');
      console.log(`   ID: ${companyWallet.id}`);
      console.log(`   Balance: ${(companyWallet.balance_micro || 0).toLocaleString()} micro units = ${((companyWallet.balance_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Earnings: ${(companyWallet.total_earnings_micro || 0).toLocaleString()} micro units = ${((companyWallet.total_earnings_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Company Fees: ${(companyWallet.total_company_fees_micro || 0).toLocaleString()} micro units = ${((companyWallet.total_company_fees_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Viewer Rewards Paid: ${(companyWallet.total_viewer_rewards_paid_micro || 0).toLocaleString()} micro units = ${((companyWallet.total_viewer_rewards_paid_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Ad Spending: ${(companyWallet.total_ad_spending_micro || 0).toLocaleString()} micro units = ${((companyWallet.total_ad_spending_micro || 0) / 1_000_000).toFixed(6)} KWD`);
      console.log(`   Total Video Views: ${companyWallet.total_video_views || 0}`);
      
      console.log('\n📊 ANALYSIS:');
      console.log(`   Company Fees Collected: ${(companyWallet.total_company_fees_micro || 0).toLocaleString()} micro units`);
      console.log(`   Viewer Rewards Paid: ${(companyWallet.total_viewer_rewards_paid_micro || 0).toLocaleString()} micro units`);
      console.log(`   Total Money Flow: ${((companyWallet.total_company_fees_micro || 0) + (companyWallet.total_viewer_rewards_paid_micro || 0)).toLocaleString()} micro units`);
      
      if ((companyWallet.total_company_fees_micro || 0) > 0) {
        console.log('\n✅ COMPANY FEES ARE BEING COLLECTED CORRECTLY!');
        console.log(`   The company has collected ${(companyWallet.total_company_fees_micro / 1_000_000).toFixed(6)} KWD in fees.`);
      } else {
        console.log('\n❌ COMPANY FEES ARE NOT BEING COLLECTED!');
        console.log('   This indicates a bug in the completeWatchingAd function.');
      }
    } else {
      console.log('❌ Company wallet not found');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await sequelize.close();
  }
}

verifyCompanyFees();
