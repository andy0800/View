// backend/src/seeders/20250101-seed-advertiser-packages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const packages = [
      {
        name: 'Basic Package',
        duration: 10, // 10 seconds
        price_per_view: 0.010, // 10 fils per view
        viewer_reward: 0.005, // 5 fils to viewer (half of 10 fils)
        company_fee: 0.005, // 5 fils to company (half of 10 fils)
        min_budget: 300.00, // Fixed starting budget: 300 KWD
        budget_increment: 100.00, // Fixed increment: 100 KWD only
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Standard Package',
        duration: 15, // 15 seconds
        price_per_view: 0.014, // 14 fils per view
        viewer_reward: 0.007, // 7 fils to viewer (half of 14 fils)
        company_fee: 0.007, // 7 fils to company (half of 14 fils)
        min_budget: 300.00, // Fixed starting budget: 300 KWD
        budget_increment: 100.00, // Fixed increment: 100 KWD only
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Premium Package',
        duration: 20, // 20 seconds
        price_per_view: 0.016, // 16 fils per view
        viewer_reward: 0.008, // 8 fils to viewer (half of 16 fils)
        company_fee: 0.008, // 8 fils to company (half of 16 fils)
        min_budget: 300.00, // Fixed starting budget: 300 KWD
        budget_increment: 100.00, // Fixed increment: 100 KWD only
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Extended Package',
        duration: 30, // 30 seconds
        price_per_view: 0.024, // 24 fils per view
        viewer_reward: 0.012, // 12 fils to viewer (half of 24 fils)
        company_fee: 0.012, // 12 fils to company (half of 24 fils)
        min_budget: 300.00, // Fixed starting budget: 300 KWD
        budget_increment: 100.00, // Fixed increment: 100 KWD only
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert packages
    await queryInterface.bulkInsert('advertiser_packages', packages, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('advertiser_packages', null, {});
  }
}; 