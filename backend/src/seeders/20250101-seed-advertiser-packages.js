// backend/src/seeders/20250101-seed-advertiser-packages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const packages = [
      {
        name: 'Basic Package',
        duration: 10, // 10 seconds
        price_per_view_micro: 10000, // 0.010 KWD in micro units (10 fils)
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '10-second video ads with maximum engagement',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Standard Package',
        duration: 15, // 15 seconds
        price_per_view_micro: 14000, // 0.014 KWD in micro units (14 fils)
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '15-second video ads with enhanced visibility',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Premium Package',
        duration: 20, // 20 seconds
        price_per_view_micro: 16000, // 0.016 KWD in micro units (16 fils)
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '20-second video ads with premium placement',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Extended Package',
        duration: 30, // 30 seconds
        price_per_view_micro: 24000, // 0.024 KWD in micro units (24 fils)
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '30-second video ads with extended reach',
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