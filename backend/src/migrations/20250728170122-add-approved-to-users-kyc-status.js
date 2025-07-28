'use strict';

module.exports = {
  up: async (queryInterface) => {
    // This will add the missing enum value
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_kyc_status"
      ADD VALUE 'approved';
    `);
  },

  down: async () => {
    // Postgres doesn’t support removing a single enum value.
    // You can throw to prevent accidental rollbacks.
    throw new Error(
      'Down migration not implemented for enum_users_kyc_status – manual cleanup required.'
    );
  }
};