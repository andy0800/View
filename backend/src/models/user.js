// backend/src/models/user.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name:          { type: DataTypes.STRING,  allowNull: false },
    civil_id:      { type: DataTypes.STRING,  allowNull: false, unique: true },
    phone:         { type: DataTypes.STRING,  allowNull: false, unique: true },
    role:          { type: DataTypes.ENUM('viewer','advertiser','admin'), allowNull: false },
    kyc_status:    { type: DataTypes.ENUM('pending','verified','rejected'), defaultValue: 'pending' },
    civil_front_key:{ type: DataTypes.STRING },
    civil_back_key:{ type: DataTypes.STRING },
    company_name:  { type: DataTypes.STRING },
    license_number:{ type: DataTypes.STRING },
    signatory_name:{ type: DataTypes.STRING },
    license_doc_key:{ type: DataTypes.STRING }
  }, {
    tableName:   'users',
    underscored: true,
    timestamps:  true
  });

  User.associate = models => {
    User.hasOne(models.Wallet,        { foreignKey: 'user_id',   as: 'wallet' });
    User.hasMany(models.Withdrawal,   { foreignKey: 'user_id',   as: 'withdrawals' });
    User.hasMany(models.Transaction,  { foreignKey: 'user_id',   as: 'transactions' });
    User.hasMany(models.ViewEvent,    { foreignKey: 'user_id',   as: 'viewEvents' });
    User.hasMany(models.Ad,           { foreignKey: 'advertiser_id', as: 'ads' });
  };

  return User;
};