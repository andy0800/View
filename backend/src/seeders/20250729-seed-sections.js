'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('sections', [
      { 
        key: 'restaurants', 
        title: 'Restaurants & Food', 
        description: 'Food delivery, restaurants, cafes, and catering services',
        icon: '🍽️',
        color: '#FF6B6B',
        is_active: true,
        sort_order: 1,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'retail', 
        title: 'Retail & Shopping', 
        description: 'Clothing, electronics, home goods, and general retail',
        icon: '🛍️',
        color: '#4ECDC4',
        is_active: true,
        sort_order: 2,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'healthcare', 
        title: 'Healthcare & Medical', 
        description: 'Hospitals, clinics, pharmacies, and medical services',
        icon: '🏥',
        color: '#45B7D1',
        is_active: true,
        sort_order: 3,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'automotive', 
        title: 'Automotive & Transport', 
        description: 'Car dealerships, repair shops, and transportation services',
        icon: '🚗',
        color: '#96CEB4',
        is_active: true,
        sort_order: 4,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'real_estate', 
        title: 'Real Estate & Property', 
        description: 'Property sales, rentals, and real estate services',
        icon: '🏠',
        color: '#FFEAA7',
        is_active: true,
        sort_order: 5,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'education', 
        title: 'Education & Training', 
        description: 'Schools, universities, training centers, and educational services',
        icon: '🎓',
        color: '#DDA0DD',
        is_active: true,
        sort_order: 6,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'beauty', 
        title: 'Beauty & Wellness', 
        description: 'Salons, spas, beauty products, and wellness services',
        icon: '💄',
        color: '#FFB6C1',
        is_active: true,
        sort_order: 7,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        key: 'finance', 
        title: 'Finance & Banking', 
        description: 'Banks, insurance, investment, and financial services',
        icon: '💰',
        color: '#98D8C8',
        is_active: true,
        sort_order: 8,
        ad_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Sections', null, {});
  }
};