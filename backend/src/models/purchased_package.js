// backend/src/models/purchased_package.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchasedPackage = sequelize.define('PurchasedPackage', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    advertiser_id: {
      type: DataTypes.UUID,
      allowNull: false, // ✅ FIXED: Made required (database has NOT NULL constraint)
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Advertiser ID who purchased the package'
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
    budget_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Total budget in micro units (1,000,000 = 1 KWD)'
    },
    remaining_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Remaining budget in micro units'
    },
    estimated_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Estimated number of views based on budget'
    },
    views_completed: {
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
        fields: ['advertiser_id'] // ✅ FIXED: Changed from user_id to advertiser_id
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
    return this.budget_micro / 1_000_000;
  };

  PurchasedPackage.prototype.getRemainingBudgetKWD = function() {
    return this.remaining_micro / 1_000_000;
  };

  PurchasedPackage.prototype.getSpentBudgetKWD = function() {
    return (this.budget_micro - this.remaining_micro) / 1_000_000;
  };

  PurchasedPackage.prototype.getSpentBudgetMicro = function() {
    return this.budget_micro - this.remaining_micro;
  };

  PurchasedPackage.prototype.canAffordView = function() {
    // Treat 'used' as a valid in-use state once an ad is created from this package.
    // As long as there is remaining budget, allow views.
    return this.remaining_micro > 0 && (this.status === 'active' || this.status === 'used');
  };

  PurchasedPackage.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  };

  PurchasedPackage.prototype.getRemainingKWD = function() {
    return this.remaining_micro / 1_000_000;
  };

  PurchasedPackage.prototype.getRemainingMicro = function() {
    return this.remaining_micro || 0;
  };

  // Add missing instance methods for controller compatibility
  PurchasedPackage.prototype.getBudgetKWD = function() {
    return this.purchased_budget || (this.budget_micro / 1_000_000) || 0;
  };

  PurchasedPackage.prototype.getUsedKWD = function() {
    return this.used_budget || (this.used_micro / 1_000_000) || 0;
  };

  PurchasedPackage.prototype.getUtilizationPercentage = function() {
    const budget = this.budget_micro || 0;
    if (budget === 0) return 0;
    const used = budget - (this.remaining_micro || 0);
    return Math.round((used / budget) * 100);
  };

  // Instance methods for budget operations
  PurchasedPackage.prototype.deductViewCost = async function(viewCostMicro, transaction) {
    if (viewCostMicro <= 0) {
      throw new Error('View cost must be positive');
    }

    if (this.remaining_micro < viewCostMicro) {
      throw new Error('Insufficient remaining budget');
    }

    // Allow deduction when status is 'active' or 'used' (used = ad created)
    if (this.status !== 'active' && this.status !== 'used') {
      throw new Error('Package is not active');
    }

    this.remaining_micro -= viewCostMicro;
    this.views_completed += 1;

    // Mark as used if budget is exhausted
    if (this.remaining_micro <= 0) {
      this.status = 'used';
    }

    await this.save({ transaction });
    return this.remaining_micro;
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
  PurchasedPackage.createFromPackage = async function(advertiserId, packageId, totalBudgetMicro, transaction) {
    const advertiserPackage = await sequelize.models.AdvertiserPackage.findByPk(packageId);
    if (!advertiserPackage) {
      throw new Error('Advertiser package not found');
    }

    const estimatedViews = Math.floor(totalBudgetMicro / advertiserPackage.price_per_view_micro);

    return this.create({
      advertiser_id: advertiserId, // ✅ FIXED: Only advertiser_id field
      package_id: packageId,
      budget_micro: totalBudgetMicro,
      remaining_micro: totalBudgetMicro,
      estimated_views: estimatedViews,
      views_completed: 0,
      status: 'active',
      purchased_at: new Date()
    }, { transaction });
  };

  PurchasedPackage.getActiveForUser = function(advertiserId) {
    return this.findAll({
      where: {
        advertiser_id: advertiserId, // ✅ FIXED: Changed from user_id to advertiser_id
        status: 'active',
        remaining_micro: {
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
        remaining_micro: {
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

  // Add missing method for advertiser controller
  PurchasedPackage.getActiveByAdvertiser = function(advertiserId) {
    const { AdvertiserPackage } = sequelize.models;
    
    return this.findAll({
      where: {
        advertiser_id: advertiserId,
        status: 'active',
        remaining_micro: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      include: [
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view_micro']
        }
      ],
      order: [['purchased_at', 'ASC']]
    });
  };

  PurchasedPackage.associate = models => {
    PurchasedPackage.belongsTo(models.User, {
      foreignKey: 'advertiser_id', // ✅ FIXED: Changed from user_id to advertiser_id
      as: 'advertiser'  // ✅ FIXED: Changed alias from 'user' to 'advertiser'
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