// backend/src/models/purchased_package.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchasedPackage = sequelize.define('PurchasedPackage', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'advertiser_packages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    total_budget_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Total budget in micro units (1,000,000 = 1 KWD)'
    },
    remaining_budget_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Remaining budget in micro units'
    },
    estimated_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Estimated number of views based on budget'
    },
    actual_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Actual number of views generated'
    },
    status: {
      type: DataTypes.ENUM('active', 'used', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    purchased_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Package expiration date'
    }
  }, {
    tableName: 'purchased_packages',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['package_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  // Instance methods for budget calculations
  PurchasedPackage.prototype.getTotalBudgetKWD = function() {
    return this.total_budget_micro / 1_000_000;
  };

  PurchasedPackage.prototype.getRemainingBudgetKWD = function() {
    return this.remaining_budget_micro / 1_000_000;
  };

  PurchasedPackage.prototype.getSpentBudgetKWD = function() {
    return (this.total_budget_micro - this.remaining_budget_micro) / 1_000_000;
  };

  PurchasedPackage.prototype.getSpentBudgetMicro = function() {
    return this.total_budget_micro - this.remaining_budget_micro;
  };

  PurchasedPackage.prototype.canAffordView = function() {
    return this.remaining_budget_micro > 0 && this.status === 'active';
  };

  PurchasedPackage.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  };

  PurchasedPackage.prototype.getRemainingKWD = function() {
    return this.remaining_budget_micro / 1_000_000;
  };

  PurchasedPackage.prototype.getRemainingMicro = function() {
    return this.remaining_budget_micro;
  };

  // Instance methods for budget operations
  PurchasedPackage.prototype.deductViewCost = async function(viewCostMicro, transaction) {
    if (viewCostMicro <= 0) {
      throw new Error('View cost must be positive');
    }

    if (this.remaining_budget_micro < viewCostMicro) {
      throw new Error('Insufficient remaining budget');
    }

    if (this.status !== 'active') {
      throw new Error('Package is not active');
    }

    this.remaining_budget_micro -= viewCostMicro;
    this.actual_views += 1;

    // Mark as used if budget is exhausted
    if (this.remaining_budget_micro <= 0) {
      this.status = 'used';
    }

    await this.save({ transaction });
    return this.remaining_budget_micro;
  };

  PurchasedPackage.prototype.markAsUsed = async function(transaction) {
    this.status = 'used';
    await this.save({ transaction });
  };

  PurchasedPackage.prototype.markAsExpired = async function(transaction) {
    this.status = 'expired';
    await this.save({ transaction });
  };

  PurchasedPackage.prototype.cancel = async function(transaction) {
    this.status = 'cancelled';
    await this.save({ transaction });
  };

  // Class methods for package management
  PurchasedPackage.createFromPackage = async function(userId, packageId, totalBudgetMicro, transaction) {
    const advertiserPackage = await sequelize.models.AdvertiserPackage.findByPk(packageId);
    if (!advertiserPackage) {
      throw new Error('Advertiser package not found');
    }

    const estimatedViews = Math.floor(totalBudgetMicro / advertiserPackage.price_per_view_micro);

    return this.create({
      user_id: userId,
      package_id: packageId,
      total_budget_micro: totalBudgetMicro,
      remaining_budget_micro: totalBudgetMicro,
      estimated_views: estimatedViews,
      actual_views: 0,
      status: 'active',
      purchased_at: new Date()
    }, { transaction });
  };

  PurchasedPackage.getActiveForUser = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        status: 'active',
        remaining_budget_micro: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      include: [
        {
          model: sequelize.models.AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view_micro']
        }
      ],
      order: [['purchased_at', 'ASC']] // FIFO order
    });
  };

  PurchasedPackage.getAvailableForViewing = function() {
    return this.findAll({
      where: {
        status: 'active',
        remaining_budget_micro: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      include: [
        {
          model: sequelize.models.AdvertiserPackage,
          as: 'package',
          where: { is_active: true },
          attributes: ['name', 'duration', 'price_per_view_micro']
        }
      ],
      order: [['purchased_at', 'ASC']]
    });
  };

  PurchasedPackage.associate = models => {
    PurchasedPackage.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    PurchasedPackage.belongsTo(models.AdvertiserPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });

    PurchasedPackage.hasMany(models.Ad, {
      foreignKey: 'purchased_package_id',
      as: 'ads'
    });

    PurchasedPackage.hasMany(models.ViewEvent, {
      foreignKey: 'purchased_package_id',
      as: 'viewEvents'
    });
  };

  return PurchasedPackage;
};