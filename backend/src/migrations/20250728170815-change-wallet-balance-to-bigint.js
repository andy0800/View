'use strict';
module.exports = {
  up: async (qi) => {
    await qi.changeColumn('Wallets', 'balance', {
      type: 'BIGINT',
      allowNull: false,
      defaultValue: 0
    });
  },
  down: async (qi) => {
    await qi.changeColumn('Wallets', 'balance', {
      type: 'DECIMAL(19,9)', // or whatever you used before
      allowNull: false,
      defaultValue: 0
    });
  }
};