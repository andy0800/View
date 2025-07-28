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

    // <<< UPDATED to INTEGER, no FK constraint >>>
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'package_id'
    },

    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'media_url'
    },

    budget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },

    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    spent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
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

    imageKey: {
      type: DataTypes.STRING,
      field: 'image_key'
    },

    link: {
      type: DataTypes.STRING
    }

  }, {
    tableName:   'ads',
    underscored: true,
    timestamps:  true
  });

  Ad.associate = models => {
    Ad.belongsTo(models.User, {
      foreignKey: 'advertiser_id',
      as:         'advertiser'
    });
    // you can keep or remove this if you’re not using AdvertiserPackage in the DB
    // Ad.belongsTo(models.AdvertiserPackage, { foreignKey: 'package_id', as: 'package' });
    Ad.hasMany(models.Video, {
      foreignKey: 'ad_id',
      as:         'videos'
    });
  };

  return Ad;
};