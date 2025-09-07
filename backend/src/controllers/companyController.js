// backend/src/controllers/companyController.js
const { CompanyWallet, Transaction, ViewEvent } = require('../models');
const { filsToKwd } = require('../utils/currencyUtils');
const { Op } = require('sequelize');

/**
 * Get company dashboard statistics
 */
async function getCompanyDashboard(req, res) {
  try {
    // Find or create company wallet
    let companyWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });

    if (!companyWallet) {
      console.log('🔍 Creating new company wallet...');
      try {
        companyWallet = await CompanyWallet.create({
          company_name: 'View App Company',
          balance: 0,
          total_earnings: 0,
          total_video_views: 0
        });
        console.log('✅ New company wallet created');
      } catch (companyWalletCreateError) {
        console.error('❌ Failed to create company wallet:', companyWalletCreateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create company wallet'
        });
      }
    }

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: {
        company_wallet_id: companyWallet.id,
        transaction_category: 'company_fee'
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get total video views today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayViews = await ViewEvent.count({
      where: {
        is_completed: true,
        viewed_at: {
          [Op.gte]: today
        }
      }
    });

    // Get total video views this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthViews = await ViewEvent.count({
      where: {
        is_completed: true,
        viewed_at: {
          [Op.gte]: thisMonth
        }
      }
    });

    // Calculate earnings today and this month
    const todayEarnings = await Transaction.sum('amount', {
      where: {
        company_wallet_id: companyWallet.id,
        transaction_category: 'company_fee',
        created_at: {
          [Op.gte]: today
        }
      }
    });

    const thisMonthEarnings = await Transaction.sum('amount', {
      where: {
        company_wallet_id: companyWallet.id,
        transaction_category: 'company_fee',
        created_at: {
          [Op.gte]: thisMonth
        }
      }
    });

    res.json({
      success: true,
      data: {
        wallet: {
          id: companyWallet.id,
          balance: (companyWallet.balance || 0) / 1_000_000, // Convert micro units to KWD
          total_earnings: (companyWallet.total_earnings || 0) / 1_000_000,
          total_video_views: companyWallet.total_video_views
        },
        statistics: {
          today_views: todayViews,
          this_month_views: thisMonthViews,
          today_earnings: (todayEarnings || 0) / 1_000_000, // Convert micro units to KWD
          this_month_earnings: (thisMonthEarnings || 0) / 1_000_000
        },
        recent_transactions: recentTransactions.map(t => ({
          id: t.id,
          amount: (t.amount || 0) / 1_000_000, // Convert micro units to KWD
          reference: t.reference,
          created_at: t.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error getting company dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company dashboard'
    });
  }
}

/**
 * Get company transaction history
 */
async function getCompanyTransactions(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Find or create company wallet
    let companyWallet = await CompanyWallet.findOne({
      where: { company_name: 'View App Company' }
    });

    if (!companyWallet) {
      console.log('🔍 Creating new company wallet...');
      try {
        companyWallet = await CompanyWallet.create({
          company_name: 'View App Company',
          balance: 0,
          total_earnings: 0,
          total_video_views: 0
        });
        console.log('✅ New company wallet created');
      } catch (companyWalletCreateError) {
        console.error('❌ Failed to create company wallet:', companyWalletCreateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create company wallet'
        });
      }
    }

    // Get transactions
    const transactions = await Transaction.findAndCountAll({
      where: {
        company_wallet_id: companyWallet.id
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows.map(t => ({
          id: t.id,
          type: t.type,
          amount: (t.amount || 0) / 1_000_000, // Convert micro units to KWD
          reference: t.reference,
          transaction_category: t.transaction_category,
          created_at: t.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.count,
          pages: Math.ceil(transactions.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting company transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company transactions'
    });
  }
}

module.exports = {
  getCompanyDashboard,
  getCompanyTransactions
};
