// backend/src/models/advertiser_package.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdvertiserPackage = sequelize.define('AdvertiserPackage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in seconds
      allowNull: false
    },
    price_per_view_micro: {
      type: DataTypes.BIGINT, // Price in micro units (1,000,000 = 1 KWD)
      allowNull: false,
      comment: 'Price per view in micro units (1,000,000 = 1 KWD)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'advertiser_packages',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['is_active']
      },
      {
        fields: ['duration']
      }
    ]
  });

  // Instance methods for micro-unit calculations
  AdvertiserPackage.prototype.getPricePerViewKWD = function() {
    return this.price_per_view_micro / 1_000_000;
  };

  AdvertiserPackage.prototype.getViewerRewardMicro = function() {
    // 50/50 split: viewer gets half
    return Math.floor(this.price_per_view_micro / 2);
  };

  AdvertiserPackage.prototype.getCompanyShareMicro = function() {
    // 50/50 split: company gets half
    const viewerShare = Math.floor(this.price_per_view_micro / 2);
    return this.price_per_view_micro - viewerShare;
  };

  AdvertiserPackage.prototype.getViewerRewardKWD = function() {
    return this.getViewerRewardMicro() / 1_000_000;
  };

  AdvertiserPackage.prototype.getCompanyShareKWD = function() {
    return this.getCompanyShareMicro() / 1_000_000;
  };

  // Class methods for package management
  AdvertiserPackage.getActivePackages = function() {
    return this.findAll({
      where: { is_active: true },
      order: [['duration', 'ASC']]
    });
  };

  AdvertiserPackage.getPackageById = function(id) {
    return this.findByPk(id);
  };

  AdvertiserPackage.getPackageByDuration = function(duration) {
    return this.findOne({
      where: { duration, is_active: true }
    });
  };

  AdvertiserPackage.associate = models => {
    AdvertiserPackage.hasMany(models.Ad, { 
      foreignKey: 'package_id', 
      as: 'ads' 
    });
    
    AdvertiserPackage.hasMany(models.PurchasedPackage, {
      foreignKey: 'package_id',
      as: 'purchasedPackages'
    });
  };

  return AdvertiserPackage;
};