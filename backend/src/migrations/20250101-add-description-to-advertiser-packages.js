// backend/src/migrations/20250101-add-description-to-advertiser-packages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add description column to advertiser_packages table
    await queryInterface.addColumn('advertiser_packages', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Package description for frontend display'
    });

    // Add price_per_view_micro column for micro-unit pricing
    await queryInterface.addColumn('advertiser_packages', 'price_per_view_micro', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'Price per view in micro units (1,000,000 = 1 KWD)'
    });

    // Update existing packages with default values
    await queryInterface.sequelize.query(`
      UPDATE advertiser_packages 
      SET 
        description = CONCAT('Package ', name, ' - ', duration, ' seconds'),
        price_per_view_micro = ROUND(price_per_view * 1000000)
      WHERE description IS NULL OR price_per_view_micro IS NULL
    `);

    // Make price_per_view_micro NOT NULL after setting default values
    await queryInterface.changeColumn('advertiser_packages', 'price_per_view_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      comment: 'Price per view in micro units (1,000,000 = 1 KWD)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('advertiser_packages', 'description');
    await queryInterface.removeColumn('advertiser_packages', 'price_per_view_micro');
  }
};
