// ⚠️ DELEGATE ONLY — MUST NOT GRANT REWARDS
// backend/src/models/company_wallet.js

// ⚠️ DUPLICATE CANDIDATE — DO NOT MODIFY
// Found during reward-logic audit
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
      allowNull: false
    },
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    balance_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    held_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    total_earnings_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    total_earnings: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    total_video_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_company_fees_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    total_viewer_rewards_paid_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    total_ad_spending_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    wallet_type: {
      type: DataTypes.ENUM('main', 'reserve', 'fees', 'rewards'),
      allowNull: false,
      defaultValue: 'main'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'company_wallets',
    underscored: true,
    timestamps: true
  });

  CompanyWallet.associate = models => {
    CompanyWallet.hasMany(models.Transaction, {
      foreignKey: 'company_wallet_id',
      as: 'transactions'
    });
  };

  return CompanyWallet;
};
