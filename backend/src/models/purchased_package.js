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
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'advertiser_packages', key: 'id' }
    },
    // KWD values for compatibility with existing database schema
    purchased_budget: {
      type: DataTypes.DECIMAL(10, 2), // Budget in KWD (e.g., 300.00)
      allowNull: false,
      comment: 'Total budget in KWD (same as budget_micro/1_000_000)'
    },
    remaining_budget: {
      type: DataTypes.DECIMAL(10, 2), // Remaining budget in KWD
      allowNull: false,
      comment: 'Remaining budget in KWD (same as remaining_micro/1_000_000)'
    },
    used_budget: {
      type: DataTypes.DECIMAL(10, 2), // Used budget in KWD
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Used budget in KWD (same as used_micro/1_000_000)'
    },
    // Micro unit values for precise calculations
    budget_micro: {
      type: DataTypes.BIGINT, // Budget in micro units (1,000,000 = 1 KWD)
      allowNull: false,
      comment: 'Total budget in micro units'
    },
    remaining_micro: {
      type: DataTypes.BIGINT, // Remaining budget in micro units
      allowNull: false,
      comment: 'Remaining budget in micro units'
    },
    used_micro: {
      type: DataTypes.BIGINT, // Used budget in micro units
      allowNull: false,
      defaultValue: 0,
      comment: 'Used budget in micro units'
    },
    estimated_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Estimated views based on budget and package price'
    },
    views_completed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of views completed'
    },
    status: {
      type: DataTypes.ENUM('active', 'used', 'expired'),
      allowNull: false,
      defaultValue: 'active'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When package expires (if applicable)'
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Optimistic locking version for concurrency control'
    }
  }, {
    tableName: 'purchased_packages',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['advertiser_id']
      },
      {
        fields: ['package_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['version']
      }
    ]
  });

  // Instance methods for KWD calculations (primary interface)
  PurchasedPackage.prototype.getBudgetKWD = function() {
    // Use stored KWD value if available, otherwise calculate from micro units
    return this.purchased_budget || (this.budget_micro / 1_000_000);
  };

  PurchasedPackage.prototype.getRemainingKWD = function() {
    // Use stored KWD value if available, otherwise calculate from micro units
    return this.remaining_budget || (this.remaining_micro / 1_000_000);
  };

  PurchasedPackage.prototype.getUsedKWD = function() {
    // Use stored KWD value if available, otherwise calculate from micro units
    return this.used_budget || (this.used_micro / 1_000_000);
  };

  PurchasedPackage.prototype.getUtilizationPercentage = function() {
    if (this.budget_micro === 0) return 0;
    return Math.round((this.used_micro / this.budget_micro) * 100);
  };

  PurchasedPackage.prototype.getRemainingViews = function() {
    return Math.floor(this.remaining_micro / this.getPackagePricePerViewMicro());
  };

  PurchasedPackage.prototype.canAffordView = function() {
    // Allow viewing if there's remaining budget, regardless of status
    // Status 'used' means the package has been converted to an ad, which is valid for viewing
    return this.remaining_micro > 0;
  };

  PurchasedPackage.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  };

  // Instance method to get package price (requires association)
  PurchasedPackage.prototype.getPackagePricePerViewMicro = function() {
    if (!this.package) {
      throw new Error('Package association not loaded. Use include: [{ model: AdvertiserPackage, as: "package" }]');
    }
    return this.package.price_per_view_micro;
  };

  // Enhanced instance method to deduct view cost with robust concurrency handling
  PurchasedPackage.prototype.deductViewCost = async function(transaction) {
    // Get the package price from the associated package
    if (!this.package) {
      throw new Error('Package association not loaded. Use include: [{ model: AdvertiserPackage, as: "package" }]');
    }
    
    const pricePerViewMicro = this.package.price_per_view_micro;
    
    if (this.remaining_micro < pricePerViewMicro) {
      throw new Error('Insufficient budget for view');
    }

    // ✅ REMOVED: Status check - allow 'used' packages with budget to be viewed
    // if (this.status !== 'active') {
    //   throw new Error('Package is not active for viewing');
    // }

    // ✅ FIXED: Ensure values are within safe numeric limits
    const newRemaining = Math.max(0, this.remaining_micro - pricePerViewMicro);
    const newUsed = this.used_micro + pricePerViewMicro;
    const newViewsCompleted = this.views_completed + 1;
    const newVersion = this.version + 1;
    
    // ✅ FIXED: Don't change status back to 'active' during view deduction
    // Once a package is 'used' (converted to ad), it should stay 'used'
    const newStatus = this.status; // Keep current status

    // ✅ FIXED: Validate numeric values before database update
    if (newUsed > 999999999999999) { // 15 digits max for DECIMAL(20,0)
      throw new Error('Used budget would exceed maximum allowed value');
    }
    
    if (newRemaining > 999999999999999) { // 15 digits max for DECIMAL(20,0)
      throw new Error('Remaining budget would exceed maximum allowed value');
    }

    // Enhanced optimistic locking with retry logic
    let updatedRows = 0;
    let retryCount = 0;
    const maxRetries = 3;

    while (updatedRows === 0 && retryCount < maxRetries) {
      try {
        // ✅ FIXED: Use proper numeric handling for database update
        const [updateResult] = await this.constructor.update({
          remaining_micro: newRemaining,
          used_micro: newUsed,
          remaining_budget: Number((newRemaining / 1_000_000).toFixed(2)), // Update KWD fields with proper rounding
          used_budget: Number((newUsed / 1_000_000).toFixed(2)),
          views_completed: newViewsCompleted,
          version: newVersion,
          status: newStatus
        }, {
          where: {
            id: this.id,
            version: this.version, // Optimistic lock check
            // ✅ REMOVED: status: 'active' - allow updates to 'used' packages with budget
          },
          transaction
        });

        updatedRows = updateResult;

        if (updatedRows === 0) {
          // Refresh instance data and retry
          await this.reload({ transaction });
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 50 * retryCount));
          }
        }
      } catch (error) {
        console.error(`Error in deductViewCost attempt ${retryCount + 1}:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error('Failed to update package after multiple attempts');
        }
      }
    }

    if (updatedRows === 0) {
      throw new Error('Concurrent modification detected. Please retry.');
    }

    // Update local instance
    this.remaining_micro = newRemaining;
    this.used_micro = newUsed;
    this.remaining_budget = Number((newRemaining / 1_000_000).toFixed(2)); // Update KWD fields with proper rounding
    this.used_budget = Number((newUsed / 1_000_000).toFixed(2));
    this.views_completed = newViewsCompleted;
    this.version = newVersion;
    this.status = newStatus;

    return {
      remaining_micro: newRemaining,
      used_micro: newUsed,
      views_completed: newViewsCompleted,
      status: newStatus,
      retryCount
    };
  };

  // Class methods for package management
  PurchasedPackage.getActiveByAdvertiser = function(advertiserId) {
    return this.findAll({
      where: {
        advertiser_id: advertiserId,
        status: 'active' // Only return truly active packages (not 'used')
      },
      include: [{
        model: sequelize.models.AdvertiserPackage,
        as: 'package'
      }],
      order: [['created_at', 'DESC']]
    });
  };

  // Method to get all packages including used ones (for history)
  PurchasedPackage.getAllByAdvertiser = function(advertiserId) {
    return this.findAll({
      where: {
        advertiser_id: advertiserId
      },
      include: [{
        model: sequelize.models.AdvertiserPackage,
        as: 'package'
      }],
      order: [['created_at', 'DESC']]
    });
  };

  PurchasedPackage.getActiveByPackage = function(packageId) {
    return this.findAll({
      where: {
        package_id: packageId,
        status: 'active'
      },
      include: [{
        model: sequelize.models.User,
        as: 'advertiser'
      }]
    });
  };

  PurchasedPackage.associate = models => {
    PurchasedPackage.belongsTo(models.User, { 
      foreignKey: 'advertiser_id', 
      as: 'advertiser' 
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
