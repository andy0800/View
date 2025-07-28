// backend/src/models/transaction.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    type:   { type: DataTypes.ENUM('credit','debit'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    reference: { type: DataTypes.STRING }
  }, {
    tableName:   'transactions',
    underscored: true,
    timestamps:  true
  });

  Transaction.associate = models => {
    Transaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Transaction;
};