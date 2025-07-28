// backend/src/models/advertiser_package.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdvertiserPackage = sequelize.define('AdvertiserPackage', {
    id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name:         { type: DataTypes.STRING, allowNull: false },
    price:        { type: DataTypes.DECIMAL(10,2), allowNull: false },
    durationDays: { type: DataTypes.INTEGER, defaultValue: 30 }
  }, {
    tableName:   'advertiser_packages',
    underscored: true,
    timestamps:  true
  });

  return AdvertiserPackage;
};