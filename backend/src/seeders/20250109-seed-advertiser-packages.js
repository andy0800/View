// backend/src/seeders/20250109-seed-advertiser-packages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🌱 Seeding advertiser packages...');

    const packages = [
      {
        id: 1,
        name: '10 Second Package',
        duration: 10, // 10 seconds
        price_per_view_micro: 10000, // 0.010 KWD in micro units
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '10-second video ads with 10 fils per viewer',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: '15 Second Package',
        duration: 15, // 15 seconds
        price_per_view_micro: 14000, // 0.014 KWD in micro units
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '15-second video ads with 14 fils per viewer',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: '20 Second Package',
        duration: 20, // 20 seconds
        price_per_view_micro: 16000, // 0.016 KWD in micro units
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '20-second video ads with 16 fils per viewer',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: '30 Second Package',
        duration: 30, // 30 seconds
        price_per_view_micro: 24000, // 0.024 KWD in micro units
        min_budget_micro: 300000000, // 300 KWD in micro units
        budget_increment_micro: 100000000, // 100 KWD in micro units
        description: '30-second video ads with 24 fils per viewer',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert packages
    await queryInterface.bulkInsert('advertiser_packages', packages, {
      updateOnDuplicate: ['name', 'duration', 'price_per_view_micro', 'min_budget_micro', 'budget_increment_micro', 'description', 'is_active', 'updated_at']
    });

    console.log('✅ Advertiser packages seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing advertiser packages...');
    
    await queryInterface.bulkDelete('advertiser_packages', {
      id: [1, 2, 3, 4]
    });

    console.log('✅ Advertiser packages removed');
  }
};
