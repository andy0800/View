// backend/src/models/withdrawal.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Withdrawal = sequelize.define('Withdrawal', {
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
    amount:   { type: DataTypes.DECIMAL(10,2), allowNull: false },
    approved: { type: DataTypes.BOOLEAN, defaultValue: null }
  }, {
    tableName:   'withdrawals',
    underscored: true,
    timestamps:  true
  });

  Withdrawal.associate = models => {
    Withdrawal.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Withdrawal;
};