// backend/src/seeders/20250101-seed-business-sections.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sections = [
      {
        key: 'restaurants',
        title: 'Restaurants & Food',
        description: 'Restaurants, cafes, food delivery, and culinary services',
        icon: 'restaurant',
        color: '#FF6B6B',
        sort_order: 1,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'retail',
        title: 'Retail & Shopping',
        description: 'Clothing, electronics, home goods, and retail stores',
        icon: 'shopping_bag',
        color: '#4ECDC4',
        sort_order: 2,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'automotive',
        title: 'Automotive',
        description: 'Car dealerships, auto services, and vehicle-related businesses',
        icon: 'directions_car',
        color: '#45B7D1',
        sort_order: 3,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'healthcare',
        title: 'Healthcare & Medical',
        description: 'Hospitals, clinics, pharmacies, and medical services',
        icon: 'local_hospital',
        color: '#96CEB4',
        sort_order: 4,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'education',
        title: 'Education & Training',
        description: 'Schools, universities, training centers, and educational services',
        icon: 'school',
        color: '#FFEAA7',
        sort_order: 5,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'real_estate',
        title: 'Real Estate',
        description: 'Property sales, rentals, and real estate services',
        icon: 'home',
        color: '#DDA0DD',
        sort_order: 6,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'finance',
        title: 'Finance & Banking',
        description: 'Banks, insurance, investment, and financial services',
        icon: 'account_balance',
        color: '#FFD93D',
        sort_order: 7,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'technology',
        title: 'Technology & IT',
        description: 'Software, hardware, IT services, and tech solutions',
        icon: 'computer',
        color: '#6C5CE7',
        sort_order: 8,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'beauty',
        title: 'Beauty & Wellness',
        description: 'Salons, spas, beauty products, and wellness services',
        icon: 'spa',
        color: '#FD79A8',
        sort_order: 9,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'entertainment',
        title: 'Entertainment & Leisure',
        description: 'Cinemas, events, sports, and entertainment venues',
        icon: 'movie',
        color: '#A29BFE',
        sort_order: 10,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'travel',
        title: 'Travel & Tourism',
        description: 'Hotels, travel agencies, and tourism services',
        icon: 'flight',
        color: '#74B9FF',
        sort_order: 11,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'services',
        title: 'Professional Services',
        description: 'Legal, consulting, marketing, and professional services',
        icon: 'business',
        color: '#55A3FF',
        sort_order: 12,
        is_active: true,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('sections', sections, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sections', null, {});
  }
}; 