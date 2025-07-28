// backend/src/models/wallet.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: { 
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
      
  balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName:   'wallets',
    underscored: true,
    timestamps:  true
  });

  Wallet.associate = models => {
    Wallet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Wallet;
};