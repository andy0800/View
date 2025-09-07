// backend/src/models/ad.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Ad = sequelize.define('Ad', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },

    advertiserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'advertiser_id',
      references: { model: 'users', key: 'id' }
    },

    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'package_id',
      references: { model: 'advertiser_packages', key: 'id' }
    },

    purchased_package_id: {
      type: DataTypes.UUID,
      allowNull: false, // Now required - ads must have a purchased package
      field: 'purchased_package_id',
      references: { model: 'purchased_packages', key: 'id' }
    },

    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'media_url'
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },

    section: {
      type: DataTypes.STRING,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'completed', 'expired'),
      allowNull: false,
      defaultValue: 'draft'
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    imageKey: {
      type: DataTypes.STRING,
      field: 'image_key'
    },

    link: {
      type: DataTypes.STRING
    },

    // Call-to-Action (CTA) fields for Instagram-style ads
    cta_link: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cta_link',
      validate: {
        isUrl: true
      }
    },

    cta_text: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cta_text',
      defaultValue: 'Learn More'
    },

    cta_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'cta_enabled',
      defaultValue: true
    },

    // Verification system fields
    verification_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'under_appeal'),
      allowNull: false,
      defaultValue: 'pending'
    },

    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    },

    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    submitted_for_review_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    review_deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },

    appeal_deadline: {
      type: DataTypes.DATE,
      allowNull: true
    }

  }, {
    tableName: 'ads',
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
        fields: ['purchased_package_id']
      },
      {
        fields: ['section']
      },
      {
        fields: ['status']
      },
      {
        fields: ['verification_status']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance methods for ad management
  Ad.prototype.getRemainingBudgetKWD = function() {
    if (!this.purchasedPackage) {
      throw new Error('PurchasedPackage association not loaded. Use include: [{ model: PurchasedPackage, as: "purchasedPackage" }]');
    }
    return this.purchasedPackage.getRemainingKWD();
  };

  Ad.prototype.getRemainingBudgetMicro = function() {
    if (!this.purchasedPackage) {
      throw new Error('PurchasedPackage association not loaded. Use include: [{ model: PurchasedPackage, as: "purchasedPackage" }]');
    }
    return this.purchasedPackage.remaining_micro;
  };

  Ad.prototype.canAffordView = function() {
    if (!this.purchasedPackage) return false;
    return this.purchasedPackage.canAffordView();
  };

  Ad.prototype.isAvailableForViewing = function() {
    // Allow either 'approved' or 'active' as valid running states
    const isRunning = this.status === 'active' || this.status === 'approved';
    return isRunning && this.is_active && this.verification_status === 'approved' && this.canAffordView();
  };

  Ad.prototype.getPackageDuration = function() {
    if (this.package) {
      return this.package.duration;
    }
    if (this.purchasedPackage && this.purchasedPackage.package) {
      return this.purchasedPackage.package.duration;
    }
    throw new Error('AdvertiserPackage association not loaded. Use include: [{ model: AdvertiserPackage, as: "package" }] or [{ model: PurchasedPackage, as: "purchasedPackage", include: [{ model: AdvertiserPackage, as: "package" }] }]');
  };

  Ad.prototype.getPackagePricePerViewMicro = function() {
    if (this.package) {
      return this.package.price_per_view_micro;
    }
    if (this.purchasedPackage && this.purchasedPackage.package) {
      return this.purchasedPackage.package.price_per_view_micro;
    }
    throw new Error('AdvertiserPackage association not loaded. Use include: [{ model: AdvertiserPackage, as: "package" }] or [{ model: PurchasedPackage, as: "purchasedPackage", include: [{ model: AdvertiserPackage, as: "package" }] }]');
  };

  // Class methods for ad management
  Ad.getActiveAdsBySection = function(sectionKey, options = {}) {
    const {
      limit = 50,
      offset = 0,
      userId = null // For filtering out already watched videos
    } = options;

    return this.findAll({
      where: {
        section: sectionKey,
        status: 'active',
        is_active: true,
        verification_status: 'approved'
      },
      include: [
        {
          model: sequelize.models.PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [sequelize.Sequelize.Op.gt]: 0 }
            // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
            // We only need remaining budget > 0 for viewing
          },
          required: true,
          include: [
            {
              model: sequelize.models.AdvertiserPackage,
              as: 'package',
              attributes: ['name', 'duration', 'price_per_view_micro']
            }
          ]
        },
        {
          model: sequelize.models.User,
          as: 'advertiser',
          attributes: ['name', 'company_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  Ad.getAdWithPackageDetails = function(adId) {
    return this.findByPk(adId, {
      include: [
        {
          model: sequelize.models.PurchasedPackage,
          as: 'purchasedPackage',
          required: true,
          include: [
            {
              model: sequelize.models.AdvertiserPackage,
              as: 'package',
              required: true
            }
          ]
        },
        {
          model: sequelize.models.User,
          as: 'advertiser',
          attributes: ['name', 'company_name']
        }
      ]
    });
  };

  Ad.associate = models => {
    Ad.belongsTo(models.User, {
      foreignKey: 'advertiser_id',
      as: 'advertiser'
    });
    
    Ad.belongsTo(models.AdvertiserPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });
    
    Ad.belongsTo(models.PurchasedPackage, {
      foreignKey: 'purchased_package_id',
      as: 'purchasedPackage'
    });
    
    Ad.hasMany(models.ViewEvent, {
      foreignKey: 'ad_id',
      as: 'viewEvents'
    });

    // Add association for comments
    Ad.hasMany(models.Comment, {
      foreignKey: 'ad_id',
      as: 'comments'
    });

    // Add verification system associations
    Ad.hasMany(models.AdAppeal, {
      foreignKey: 'ad_id',
      as: 'appeals'
    });

    Ad.hasMany(models.AdVerificationHistory, {
      foreignKey: 'ad_id',
      as: 'verificationHistory'
    });

    Ad.belongsTo(models.User, {
      foreignKey: 'verified_by',
      as: 'verifier'
    });
  };

  return Ad;
};