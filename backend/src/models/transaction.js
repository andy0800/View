// backend/src/models/transaction.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    from_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null for deposits
      references: { model: 'wallets', key: 'id' }
    },
    to_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null for withdrawals
      references: { model: 'wallets', key: 'id' }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null for company transactions
      references: { model: 'users', key: 'id' }
    },
    company_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null for user transactions
      references: { model: 'company_wallets', key: 'id' }
    },
    type: { 
      type: DataTypes.ENUM(
        'purchase',           // Package purchase
        'view_charge',        // Ad view charge
        'viewer_reward',      // Viewer reward for watching
        'company_fee',        // Company fee from view
        'withdraw',           // Withdrawal request
        'deposit',            // Deposit
        'refund',             // Refund
        'transfer'            // Internal transfer
      ), 
      allowNull: false 
    },
    amount: { 
      type: DataTypes.BIGINT, // Store amounts in micro units (1,000,000 = 1 KWD)
      allowNull: false,
      comment: 'Transaction amount in micro units (same as amount_micro for compatibility)'
    },
    amount_micro: { 
      type: DataTypes.BIGINT, // Store amounts in micro units (1,000,000 = 1 KWD)
      allowNull: false,
      comment: 'Transaction amount in micro units'
    },
    reference: { 
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Human-readable reference for the transaction'
    },
    reference_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'External reference ID (e.g., MyFatoorah session ID, Stripe payment intent ID)'
    },
    payment_gateway: {
      type: DataTypes.ENUM('stripe', 'myfatoorah', 'manual', 'internal'),
      allowNull: true,
      defaultValue: 'internal',
      comment: 'Payment gateway used for the transaction'
    },
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Payment method used (card, bank_transfer, etc.)'
    },
    gateway_transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Transaction ID from payment gateway'
    },
    gateway_response: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full response from payment gateway'
    },
    transaction_category: {
      type: DataTypes.ENUM(
        'package_purchase',   // Advertiser package purchase
        'ad_view',            // Individual ad view
        'viewer_reward',      // Viewer reward
        'company_fee',        // Company fee
        'withdrawal',         // Withdrawal request
        'deposit',            // Deposit
        'refund',             // Refund
        'transfer'            // Internal transfer
      ),
      allowNull: false,
      defaultValue: 'ad_view'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed'
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional transaction metadata (ad_id, package_id, etc.)'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When transaction was processed'
    }
  }, {
    tableName: 'transactions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['from_wallet_id']
      },
      {
        fields: ['to_wallet_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['transaction_category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['reference_id']
      },
      {
        fields: ['payment_gateway']
      },
      {
        fields: ['gateway_transaction_id']
      }
    ]
  });

  // Instance methods for micro-unit calculations
  Transaction.prototype.getAmountKWD = function() {
    return this.amount_micro / 1_000_000;
  };

  Transaction.prototype.isDebit = function() {
    return ['withdraw', 'view_charge', 'purchase'].includes(this.type);
  };

  Transaction.prototype.isCredit = function() {
    return ['deposit', 'viewer_reward', 'refund'].includes(this.type);
  };

  Transaction.prototype.isTransfer = function() {
    return this.type === 'transfer';
  };

  // Class methods for transaction management
  Transaction.createViewTransaction = function(data, transaction) {
    const {
      fromWalletId,
      toWalletId,
      userId,
      amountMicro,
      adId,
      purchasedPackageId,
      type = 'view_charge'
    } = data;

    return this.create({
      from_wallet_id: fromWalletId || null,
      to_wallet_id: toWalletId || null,
      user_id: userId,
      type,
      amount: amountMicro, // Store as micro units (for compatibility)
      amount_micro: amountMicro,
      transaction_category: 'ad_view',
      status: 'completed',
      reference: `Ad view: ${adId}`,
      meta: {
        ad_id: adId,
        purchased_package_id: purchasedPackageId,
        timestamp: new Date().toISOString()
      },
      processed_at: new Date()
    }, { transaction });
  };

  Transaction.createRewardTransaction = function(data, transaction) {
    const {
      toWalletId,
      userId,
      amountMicro,
      adId,
      purchasedPackageId
    } = data;

    return this.create({
      to_wallet_id: toWalletId,
      user_id: userId,
      type: 'viewer_reward',
      amount: amountMicro, // Store as micro units (for compatibility)
      amount_micro: amountMicro,
      transaction_category: 'viewer_reward',
      status: 'completed',
      reference: `Viewer reward: ${adId}`,
      meta: {
        ad_id: adId,
        purchased_package_id: purchasedPackageId,
        timestamp: new Date().toISOString()
      },
      processed_at: new Date()
    }, { transaction });
  };

  Transaction.createCompanyFeeTransaction = function(data, transaction) {
    const {
      toWalletId,
      amountMicro,
      adId,
      purchasedPackageId
    } = data;

    return this.create({
      to_wallet_id: toWalletId,
      type: 'company_fee',
      amount: amountMicro, // Store as micro units (for compatibility)
      amount_micro: amountMicro,
      transaction_category: 'company_fee',
      status: 'completed',
      reference: `Company fee: ${adId}`,
      meta: {
        ad_id: adId,
        purchased_package_id: purchasedPackageId,
        timestamp: new Date().toISOString()
      },
      processed_at: new Date()
    }, { transaction });
  };

  Transaction.createPackagePurchaseTransaction = function(data, transaction) {
    const {
      fromWalletId,
      userId,
      amountMicro,
      packageId,
      estimatedViews
    } = data;

    console.log('🔍 Debug - Creating package purchase transaction with amount:', amountMicro);

    const createData = {
      from_wallet_id: fromWalletId,
      user_id: userId,
      type: 'purchase',
      amount: amountMicro, // Store as micro units (for compatibility)
      amount_micro: amountMicro,
      transaction_category: 'package_purchase',
      status: 'completed',
      reference: `Package purchase: ${estimatedViews} estimated views`,
      meta: {
        package_id: packageId,
        estimated_views: estimatedViews,
        timestamp: new Date().toISOString()
      },
      processed_at: new Date()
    };

    console.log('🔍 Debug - Create data object:', JSON.stringify(createData, null, 2));

    return this.create(createData, { transaction });
  };

  // Helper methods for transaction type checking
  Transaction.prototype.isDebit = function() {
    return ['purchase', 'view_charge', 'withdraw'].includes(this.type);
  };

  Transaction.prototype.isCredit = function() {
    return ['viewer_reward', 'deposit', 'refund'].includes(this.type);
  };

  Transaction.prototype.isTransfer = function() {
    return this.type === 'transfer';
  };

  Transaction.prototype.getAmountKWD = function() {
    if (!this.amount_micro) return 0;
    return parseFloat(this.amount_micro) / 1_000_000;
  };

  Transaction.associate = models => {
    Transaction.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
    
    Transaction.belongsTo(models.CompanyWallet, { 
      foreignKey: 'company_wallet_id', 
      as: 'companyWallet' 
    });

    Transaction.belongsTo(models.Wallet, {
      foreignKey: 'from_wallet_id',
      as: 'fromWallet'
    });

    Transaction.belongsTo(models.Wallet, {
      foreignKey: 'to_wallet_id',
      as: 'toWallet'
    });
  };

  return Transaction;
};