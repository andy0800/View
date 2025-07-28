'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Alter the column to BIGINT, using the integer portion of existing values
    await queryInterface.changeColumn('Wallets', 'balance', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback to DECIMAL(12,12) if you must
    await queryInterface.changeColumn('Wallets', 'balance', {
      type: Sequelize.DECIMAL(12,12),
      allowNull: false,
      defaultValue: 0
    });
  }
};