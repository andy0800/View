'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add reference_id field to transactions table
    await queryInterface.addColumn('transactions', 'reference_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'External reference ID (e.g., MyFatoorah session ID, Stripe payment intent ID)'
    });

    // Add payment_gateway field to transactions table
    await queryInterface.addColumn('transactions', 'payment_gateway', {
      type: Sequelize.ENUM('stripe', 'myfatoorah', 'manual', 'internal'),
      allowNull: true,
      defaultValue: 'internal',
      comment: 'Payment gateway used for the transaction'
    });

    // Add payment_method field to transactions table
    await queryInterface.addColumn('transactions', 'payment_method', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Payment method used (card, bank_transfer, etc.)'
    });

    // Add gateway_transaction_id field to transactions table
    await queryInterface.addColumn('transactions', 'gateway_transaction_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Transaction ID from payment gateway'
    });

    // Add gateway_response field to transactions table
    await queryInterface.addColumn('transactions', 'gateway_response', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Full response from payment gateway'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('transactions', ['reference_id']);
    await queryInterface.addIndex('transactions', ['payment_gateway']);
    await queryInterface.addIndex('transactions', ['gateway_transaction_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('transactions', ['reference_id']);
    await queryInterface.removeIndex('transactions', ['payment_gateway']);
    await queryInterface.removeIndex('transactions', ['gateway_transaction_id']);

    // Remove columns
    await queryInterface.removeColumn('transactions', 'reference_id');
    await queryInterface.removeColumn('transactions', 'payment_gateway');
    await queryInterface.removeColumn('transactions', 'payment_method');
    await queryInterface.removeColumn('transactions', 'gateway_transaction_id');
    await queryInterface.removeColumn('transactions', 'gateway_response');
  }
};
