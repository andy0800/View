// backend/src/models/companyWallet.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const CompanyWallet = sequelize.define('CompanyWallet', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Main Company Wallet',
      comment: 'Wallet name for identification'
    },
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Company name for identification (legacy support)'
    },
    balance_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Current balance in micro units (1,000,000 = 1 KWD)'
    },
    balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Legacy balance field for backward compatibility'
    },
    held_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Held balance for pending transactions in micro units'
    },
    total_earnings_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total earnings since wallet creation in micro units'
    },
    total_earnings: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Legacy total earnings field for backward compatibility'
    },
    total_video_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total video views that generated company fees'
    },
    total_company_fees_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total company fees collected in micro units'
    },
    total_viewer_rewards_paid_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total viewer rewards paid out in micro units'
    },
    total_ad_spending_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total ad spending tracked in micro units'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this wallet is active'
    },
    wallet_type: {
      type: DataTypes.ENUM('main', 'reserve', 'operational'),
      allowNull: false,
      defaultValue: 'main',
      comment: 'Type of company wallet'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional description of the wallet'
    }
  }, {
    tableName: 'company_wallets',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['is_active']
      },
      {
        fields: ['wallet_type']
      },
      {
        fields: ['balance_micro']
      }
    ]
  });

  // Instance methods for micro-unit calculations
  CompanyWallet.prototype.getBalanceKWD = function() {
    return (this.balance_micro || this.balance || 0) / 1_000_000;
  };

  CompanyWallet.prototype.getBalanceMicro = function() {
    return this.balance_micro || this.balance || 0;
  };

  CompanyWallet.prototype.getHeldKWD = function() {
    return (this.held_micro || 0) / 1_000_000;
  };

  CompanyWallet.prototype.getHeldMicro = function() {
    return this.held_micro || 0;
  };

  CompanyWallet.prototype.getAvailableBalanceKWD = function() {
    const balance = this.balance_micro || this.balance || 0;
    const held = this.held_micro || 0;
    return (balance - held) / 1_000_000;
  };

  CompanyWallet.prototype.getAvailableBalanceMicro = function() {
    const balance = this.balance_micro || this.balance || 0;
    const held = this.held_micro || 0;
    return balance - held;
  };

  CompanyWallet.prototype.getTotalEarningsKWD = function() {
    return (this.total_earnings_micro || this.total_earnings || 0) / 1_000_000;
  };

  CompanyWallet.prototype.getTotalEarningsMicro = function() {
    return this.total_earnings_micro || this.total_earnings || 0;
  };

  CompanyWallet.prototype.getTotalCompanyFeesKWD = function() {
    return (this.total_company_fees_micro || 0) / 1_000_000;
  };

  CompanyWallet.prototype.getTotalCompanyFeesMicro = function() {
    return this.total_company_fees_micro || 0;
  };

  CompanyWallet.prototype.getTotalViewerRewardsPaidKWD = function() {
    return (this.total_viewer_rewards_paid_micro || 0) / 1_000_000;
  };

  CompanyWallet.prototype.getTotalViewerRewardsPaidMicro = function() {
    return this.total_viewer_rewards_paid_micro || 0;
  };

  CompanyWallet.prototype.getTotalAdSpendingKWD = function() {
    return (this.total_ad_spending_micro || 0) / 1_000_000;
  };

  CompanyWallet.prototype.getTotalAdSpendingMicro = function() {
    return this.total_ad_spending_micro || 0;
  };

  // Instance methods for balance operations
  CompanyWallet.prototype.addCompanyFee = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion to prevent string concatenation
    const currentBalanceMicro = parseInt(this.balance_micro || this.balance || 0);
    const currentTotalEarningsMicro = parseInt(this.total_earnings_micro || this.total_earnings || 0);
    const currentTotalCompanyFeesMicro = parseInt(this.total_company_fees_micro || 0);
    const newAmountMicro = parseInt(amountMicro);

    // ✅ ADDED: Additional safety check to ensure all values are numbers
    if (isNaN(currentBalanceMicro) || isNaN(currentTotalEarningsMicro) || isNaN(currentTotalCompanyFeesMicro) || isNaN(newAmountMicro)) {
      throw new Error('Invalid numeric values detected in company wallet');
    }

    // Update both new and legacy fields for compatibility
    this.balance_micro = currentBalanceMicro + newAmountMicro;
    this.balance = this.balance_micro; // Keep legacy field in sync
    this.total_earnings_micro = currentTotalEarningsMicro + newAmountMicro;
    this.total_earnings = this.total_earnings_micro; // Keep legacy field in sync
    this.total_company_fees_micro = currentTotalCompanyFeesMicro + newAmountMicro;
    this.total_video_views += 1;

    await this.save({ transaction });
    return this.balance_micro;
  };

  CompanyWallet.prototype.addAdSpending = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentTotalAdSpendingMicro = parseInt(this.total_ad_spending_micro || 0);
    const newAmountMicro = parseInt(amountMicro);

    this.total_ad_spending_micro = currentTotalAdSpendingMicro + newAmountMicro;
    await this.save({ transaction });
    return this.total_ad_spending_micro;
  };

  CompanyWallet.prototype.addViewerReward = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentTotalViewerRewardsMicro = parseInt(this.total_viewer_rewards_paid_micro || 0);
    const newAmountMicro = parseInt(amountMicro);

    this.total_viewer_rewards_paid_micro = currentTotalViewerRewardsMicro + newAmountMicro;
    await this.save({ transaction });
    return this.total_viewer_rewards_paid_micro;
  };

  CompanyWallet.prototype.deductBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentBalance = parseInt(this.balance_micro || this.balance || 0);
    const newAmountMicro = parseInt(amountMicro);

    if (currentBalance < newAmountMicro) {
      throw new Error('Insufficient company wallet balance');
    }

    this.balance_micro = currentBalance - newAmountMicro;
    this.balance = this.balance_micro; // Keep legacy field in sync
    await this.save({ transaction });
    return this.balance_micro;
  };

  CompanyWallet.prototype.holdBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentBalance = parseInt(this.balance_micro || this.balance || 0);
    const currentHeld = parseInt(this.held_micro || 0);
    const newAmountMicro = parseInt(amountMicro);
    
    if (currentBalance < (currentHeld + newAmountMicro)) {
      throw new Error('Insufficient available balance');
    }

    this.held_micro = currentHeld + newAmountMicro;
    await this.save({ transaction });
    return this.held_micro;
  };

  CompanyWallet.prototype.releaseHeldBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentHeld = parseInt(this.held_micro || 0);
    const newAmountMicro = parseInt(amountMicro);

    if (currentHeld < newAmountMicro) {
      throw new Error('Insufficient held balance');
    }

    this.held_micro = currentHeld - newAmountMicro;
    await this.save({ transaction });
    return this.held_micro;
  };

  // Class methods for company wallet management
  CompanyWallet.getMainWallet = function() {
    return this.findOne({
      where: { 
        wallet_type: 'main',
        is_active: true 
      },
      // Add performance optimizations
      attributes: [
        'id', 'name', 'company_name', 'balance_micro', 'balance', 
        'held_micro', 'total_earnings_micro', 'total_earnings',
        'total_video_views', 'total_company_fees_micro', 
        'total_viewer_rewards_paid_micro', 'total_ad_spending_micro',
        'wallet_type', 'is_active', 'description'
      ],
      // Add caching hint
      cache: true
    });
  };

  CompanyWallet.createMainWallet = function(initialBalanceMicro = 0) {
    return this.create({
      name: 'Main Company Wallet',
      company_name: 'Main Company Wallet',
      balance_micro: initialBalanceMicro,
      balance: initialBalanceMicro,
      total_earnings_micro: 0,
      total_earnings: 0,
      total_video_views: 0,
      wallet_type: 'main',
      is_active: true,
      description: 'Primary company wallet for all operations'
    });
  };

  CompanyWallet.getOrCreateMainWallet = async function(initialBalanceMicro = 0) {
    let wallet = await this.getMainWallet();
    
    if (!wallet) {
      wallet = await this.createMainWallet(initialBalanceMicro);
    }
    
    return wallet;
  };

  CompanyWallet.getWalletStats = async function() {
    const mainWallet = await this.getMainWallet();
    
    if (!mainWallet) {
      return {
        total_earnings: 0,
        total_company_fees: 0,
        total_viewer_rewards: 0,
        total_ad_spending: 0,
        current_balance: 0,
        total_video_views: 0
      };
    }

    return {
      total_earnings: mainWallet.getTotalEarningsKWD(),
      total_company_fees: mainWallet.getTotalCompanyFeesKWD(),
      total_viewer_rewards: mainWallet.getTotalViewerRewardsPaidKWD(),
      total_ad_spending: mainWallet.getTotalAdSpendingKWD(),
      current_balance: mainWallet.getBalanceKWD(),
      total_video_views: mainWallet.total_video_views
    };
  };

  CompanyWallet.associate = models => {
    // Association removed since created_by column doesn't exist in current schema
    // CompanyWallet.belongsTo(models.User, {
    //   foreignKey: 'created_by',
    //   as: 'creator'
    // });
  };

  return CompanyWallet;
};
