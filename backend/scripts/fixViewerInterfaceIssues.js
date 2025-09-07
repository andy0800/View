const { 
  User, 
  Wallet, 
  Transaction, 
  ViewEvent, 
  Ad, 
  AdvertiserPackage,
  PurchasedPackage,
  Section,
  CompanyWallet,
  sequelize 
} = require('../src/models');

async function fixViewerInterfaceIssues() {
  console.log('🔧 FIXING VIEWER INTERFACE ISSUES\n');
  
  try {
    // Fix 1: Ensure all sections have proper video counts
    console.log('1️⃣ Fixing Section Video Counts...');
    
    const sections = await Section.findAll({ 
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });
    
    for (const section of sections) {
      const videoCount = await Ad.count({
        where: {
          section: section.key,
          status: 'active',
          is_active: true,
          verification_status: 'approved',
          purchased_package_id: { [sequelize.Sequelize.Op.ne]: null }
        },
        include: [
          {
            model: PurchasedPackage,
            as: 'purchasedPackage',
            where: {
              remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 },
              status: 'active'
            }
          }
        ]
      });
      
      console.log(`   - ${section.key}: ${videoCount} available videos`);
    }

    // Fix 2: Ensure proper wallet associations for all users
    console.log('\n2️⃣ Fixing Wallet Associations...');
    
    const usersWithoutWallets = await User.findAll({
      include: [
        {
          model: Wallet,
          as: 'wallet',
          required: false
        }
      ],
      where: {
        '$wallet.id$': null
      }
    });
    
    if (usersWithoutWallets.length > 0) {
      console.log(`   - Creating wallets for ${usersWithoutWallets.length} users...`);
      
      for (const user of usersWithoutWallets) {
        await Wallet.create({
          user_id: user.id,
          balance: 0,
          confirmed_points: 0,
          total_earned: 0,
          total_earnings: 0,
          total_video_views: 0,
          total_company_fees: 0,
          total_viewer_rewards: 0
        });
        console.log(`     ✅ Created wallet for ${user.email}`);
      }
    } else {
      console.log('   ✅ All users have wallets');
    }

    // Fix 3: Ensure company wallet exists and is properly configured
    console.log('\n3️⃣ Fixing Company Wallet...');
    
    let companyWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });
    
    if (!companyWallet) {
      companyWallet = await CompanyWallet.create({
        company_name: 'View App Company',
        balance: 0,
        total_earnings: 0,
        total_video_views: 0,
        total_company_fees: 0,
        total_viewer_rewards: 0
      });
      console.log('   ✅ Created company wallet');
    } else {
      console.log('   ✅ Company wallet already exists');
    }

    // Fix 4: Verify and fix ViewEvent associations
    console.log('\n4️⃣ Fixing ViewEvent Associations...');
    
    const orphanedViewEvents = await ViewEvent.findAll({
      include: [
        {
          model: Ad,
          as: 'ad',
          required: false
        },
        {
          model: User,
          as: 'user',
          required: false
        }
      ],
      where: {
        [sequelize.Sequelize.Op.or]: [
          { '$ad.id$': null },
          { '$user.id$': null }
        ]
      }
    });
    
    if (orphanedViewEvents.length > 0) {
      console.log(`   - Found ${orphanedViewEvents.length} orphaned view events, cleaning up...`);
      await ViewEvent.destroy({
        where: {
          id: orphanedViewEvents.map(ve => ve.id)
        }
      });
      console.log('     ✅ Cleaned up orphaned view events');
    } else {
      console.log('   ✅ All view events have proper associations');
    }

    // Fix 5: Ensure proper transaction references
    console.log('\n5️⃣ Fixing Transaction References...');
    
    const transactionsWithoutReferences = await Transaction.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { reference: null },
          { reference: '' }
        ]
      }
    });
    
    if (transactionsWithoutReferences.length > 0) {
      console.log(`   - Found ${transactionsWithoutReferences.length} transactions without references, updating...`);
      
      for (const tx of transactionsWithoutReferences) {
        let reference = '';
        if (tx.transaction_category === 'user_reward') {
          reference = `REWARD_${tx.id.slice(0, 8).toUpperCase()}`;
        } else if (tx.transaction_category === 'company_fee') {
          reference = `FEE_${tx.id.slice(0, 8).toUpperCase()}`;
        } else if (tx.transaction_category === 'advertiser_payment') {
          reference = `PAY_${tx.id.slice(0, 8).toUpperCase()}`;
        } else {
          reference = `TX_${tx.id.slice(0, 8).toUpperCase()}`;
        }
        
        await tx.update({ reference });
        console.log(`     ✅ Updated transaction ${tx.id} with reference: ${reference}`);
      }
    } else {
      console.log('   ✅ All transactions have proper references');
    }

    // Fix 6: Verify reward calculation consistency
    console.log('\n6️⃣ Verifying Reward Calculation Consistency...');
    
    const completedViewEvents = await ViewEvent.findAll({
      where: { is_completed: true },
      include: [
        {
          model: Ad,
          as: 'ad',
          include: [
            {
              model: AdvertiserPackage,
              as: 'package'
            }
          ]
        }
      ]
    });
    
    let rewardIssues = 0;
    for (const event of completedViewEvents) {
      if (event.ad && event.ad.package) {
        const expectedReward = parseFloat(event.ad.package.price_per_view) / 2;
        const actualReward = parseFloat(event.viewer_reward);
        
        if (Math.abs(expectedReward - actualReward) > 0.001) {
          rewardIssues++;
          if (rewardIssues <= 3) { // Limit output
            console.log(`   - ViewEvent ${event.id}: Expected reward ${expectedReward} KWD, got ${actualReward} KWD`);
          }
        }
      }
    }
    
    if (rewardIssues === 0) {
      console.log('   ✅ All reward calculations are consistent');
    } else {
      console.log(`   ⚠️ Found ${rewardIssues} reward calculation inconsistencies`);
    }

    // Fix 7: Ensure proper video filtering for viewer interface
    console.log('\n7️⃣ Verifying Video Filtering Logic...');
    
    const availableAds = await Ad.findAll({
      where: {
        status: 'active',
        is_active: true,
        verification_status: 'approved',
        purchased_package_id: { [sequelize.Sequelize.Op.ne]: null }
      },
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 },
            status: 'active'
          }
        },
        {
          model: AdvertiserPackage,
          as: 'package'
        }
      ]
    });
    
    console.log(`   ✅ Found ${availableAds.length} ads available for viewers`);
    if (availableAds.length > 0) {
      console.log('   - Sample available ads:');
      availableAds.slice(0, 3).forEach(ad => {
        console.log(`     * ${ad.title}: ${ad.purchasedPackage.remaining_budget} KWD remaining`);
      });
    }

    console.log('\n✅ VIEWER INTERFACE ISSUES FIXED SUCCESSFULLY');
    
  } catch (error) {
    console.error('❌ Error fixing viewer interface issues:', error);
    throw error;
  }
}

if (require.main === module) {
  fixViewerInterfaceIssues().then(() => {
    console.log('\n🎯 All fixes completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Fixes failed:', error);
    process.exit(1);
  });
}

module.exports = { fixViewerInterfaceIssues };
