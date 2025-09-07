// backend/src/controllers/walletController.js
const { Wallet, Transaction, sequelize } = require('../models');
const { microToKwd, kwdToMicro } = require('../constants/advertiser');

// Get wallet balance
async function getBalance(req, res) {
  try {
    const userId = req.user.id;
    
    // Handle admin user (admin has id: 0, which is not a valid UUID)
    if (userId === 0) {
      return res.json({
        success: true,
        balance: 0,
        balanceMicro: '0',
        heldBalance: 0,
        heldMicro: '0',
        availableBalance: 0,
        availableMicro: 0
      });
    }
    
    let wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createForUser(userId);
    }

    res.json({
      success: true,
      balance: wallet.getBalanceKWD(),
      balanceMicro: wallet.balance_micro,
      heldBalance: wallet.getHeldKWD(),
      heldMicro: wallet.held_micro,
      availableBalance: wallet.getAvailableBalanceKWD(),
      availableMicro: wallet.getAvailableBalanceMicro()
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ message: 'Failed to get wallet balance' });
  }
}

// Get wallet transactions
async function getTransactions(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    // Handle admin user (admin has id: 0, which is not a valid UUID)
    if (userId === 0) {
      return res.json({
        success: true,
        transactions: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }
    
    const offset = (page - 1) * limit;
    
    const whereClause = { user_id: userId };
    if (type) {
      whereClause.type = type;
    }

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Wallet,
          as: 'fromWallet',
          attributes: ['id']
        },
        {
          model: Wallet,
          as: 'toWallet',
          attributes: ['id']
        }
      ]
    });

    const transformedTransactions = transactions.rows.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.getAmountKWD(),
      amountMicro: tx.amount_micro,
      reference: tx.reference,
      status: tx.status,
      category: tx.transaction_category,
      createdAt: tx.created_at,
      processedAt: tx.processed_at,
      meta: tx.meta,
      isDebit: tx.isDebit(),
      isCredit: tx.isCredit(),
      isTransfer: tx.isTransfer()
    }));

    res.json({
      success: true,
      transactions: transformedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.count,
        pages: Math.ceil(transactions.count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
}

// Redeem points (withdraw money)
async function redeemPoints(req, res) {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const amountKWD = parseFloat(amount);
    const amountMicro = kwdToMicro(amountKWD);

    // Get or create wallet
    let wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createForUser(userId);
    }

    // Check if user has sufficient available balance
    if (wallet.getAvailableBalanceMicro() < amountMicro) {
      return res.status(400).json({ 
        message: `Insufficient available balance. Required: ${amountKWD} KWD, Available: ${wallet.getAvailableBalanceKWD()} KWD` 
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Hold the amount (prevent double-spending)
      await wallet.holdBalance(amountMicro, transaction);

      // Create withdrawal transaction
      await Transaction.create({
        from_wallet_id: wallet.id,
        user_id: userId,
        type: 'withdraw',
        amount_micro: amountMicro,
        transaction_category: 'withdrawal',
        status: 'pending',
        reference: `Withdrawal request for ${amountKWD} KWD`,
        meta: {
          withdrawal_type: 'manual',
          requested_amount: amountKWD
        }
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal: {
          amount: amountKWD,
          amountMicro: amountMicro,
          status: 'pending'
        },
        newAvailableBalance: wallet.getAvailableBalanceKWD()
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error in redeemPoints:', error);
    res.status(500).json({ message: 'Server error while processing withdrawal' });
  }
}

// Legacy reward function (maintained for backward compatibility)
async function rewardForVideo(req, res) {
  try {
    const { adId } = req.body;
    const userId = req.user.id;

    if (!adId) {
      return res.status(400).json({ message: 'Ad ID is required' });
    }

    // Redirect to new completeView endpoint
    res.status(400).json({ 
      message: 'Please use the new view completion system',
      redirectTo: `/api/viewer/complete-view`
    });

  } catch (error) {
    console.error('Error in legacy rewardForVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get wallet statistics
async function getWalletStats(req, res) {
  try {
    const userId = req.user.id;
    
    let wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createForUser(userId);
    }

    // Get transaction statistics
    const [totalEarnings, totalSpent, totalWithdrawals] = await Promise.all([
      Transaction.sum('amount_micro', {
        where: {
          user_id: userId,
          type: 'viewer_reward',
          status: 'completed'
        }
      }),
      Transaction.sum('amount_micro', {
        where: {
          user_id: userId,
          type: 'purchase',
          status: 'completed'
        }
      }),
      Transaction.sum('amount_micro', {
        where: {
          user_id: userId,
          type: 'withdraw',
          status: 'completed'
        }
      })
    ]);

    const stats = {
      currentBalance: wallet.getBalanceKWD(),
      currentBalanceMicro: wallet.balance_micro,
      heldBalance: wallet.getHeldKWD(),
      heldMicro: wallet.held_micro,
      availableBalance: wallet.getAvailableBalanceKWD(),
      availableMicro: wallet.getAvailableBalanceMicro(),
      totalEarnings: microToKwd(totalEarnings || 0),
      totalEarningsMicro: totalEarnings || 0,
      totalSpent: microToKwd(totalSpent || 0),
      totalSpentMicro: totalSpent || 0,
      totalWithdrawals: microToKwd(totalWithdrawals || 0),
      totalWithdrawalsMicro: totalWithdrawals || 0,
      netWorth: wallet.getBalanceKWD() + (microToKwd(totalEarnings || 0) - microToKwd(totalSpent || 0) - microToKwd(totalWithdrawals || 0))
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting wallet stats:', error);
    res.status(500).json({ message: 'Failed to get wallet statistics' });
  }
}

// Deposit money (for testing/admin purposes)
async function depositMoney(req, res) {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const amountKWD = parseFloat(amount);
    const amountMicro = kwdToMicro(amountKWD);

    // Get or create wallet
    let wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createForUser(userId);
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Add money to wallet
      await wallet.addBalance(amountMicro, transaction);

      // Create deposit transaction
      await Transaction.create({
        to_wallet_id: wallet.id,
        user_id: userId,
        type: 'deposit',
        amount_micro: amountMicro,
        transaction_category: 'deposit',
        status: 'completed',
        reference: `Deposit of ${amountKWD} KWD`,
        meta: {
          deposit_type: 'manual',
          amount: amountKWD
        },
        processed_at: new Date()
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Deposit successful',
        deposit: {
          amount: amountKWD,
          amountMicro: amountMicro,
          status: 'completed'
        },
        newBalance: wallet.getBalanceKWD()
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error in depositMoney:', error);
    res.status(500).json({ message: 'Server error while processing deposit' });
  }
}

module.exports = {
  getBalance,
  getTransactions,
  redeemPoints,
  rewardForVideo,
  getWalletStats,
  depositMoney
};