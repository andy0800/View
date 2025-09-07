// Script to populate business sections in the database
const { Section, sequelize } = require('../src/models');

async function populateSections() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check existing sections
    const existingSections = await Section.findAll();
    console.log(`📊 Current sections count: ${existingSections.length}`);

    if (existingSections.length === 0) {
      console.log('📦 No sections found, seeding database...');
      
      // Define the business sections according to original VIEW APP structure
      const sections = [
        {
          key: 'restaurants',
          title: 'Restaurants & Food',
          description: 'Restaurants, cafes, food delivery, and culinary services',
          icon: 'restaurant',
          color: '#FF6B6B',
          sort_order: 1,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'retail',
          title: 'Retail & Shopping',
          description: 'Clothing, electronics, home goods, and retail stores',
          icon: 'shopping_bag',
          color: '#4ECDC4',
          sort_order: 2,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'automotive',
          title: 'Automotive',
          description: 'Car dealerships, auto services, and vehicle-related businesses',
          icon: 'directions_car',
          color: '#45B7D1',
          sort_order: 3,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'healthcare',
          title: 'Healthcare & Medical',
          description: 'Hospitals, clinics, pharmacies, and medical services',
          icon: 'local_hospital',
          color: '#96CEB4',
          sort_order: 4,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'education',
          title: 'Education & Training',
          description: 'Schools, universities, training centers, and educational services',
          icon: 'school',
          color: '#FFEAA7',
          sort_order: 5,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'real_estate',
          title: 'Real Estate',
          description: 'Property sales, rentals, and real estate services',
          icon: 'home',
          color: '#DDA0DD',
          sort_order: 6,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'finance',
          title: 'Finance & Banking',
          description: 'Banks, insurance, investment, and financial services',
          icon: 'account_balance',
          color: '#FD79A8',
          sort_order: 7,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'technology',
          title: 'Technology & IT',
          description: 'Software, hardware, IT services, and tech solutions',
          icon: 'computer',
          color: '#00B894',
          sort_order: 8,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'beauty',
          title: 'Beauty & Wellness',
          description: 'Salons, spas, beauty products, and wellness services',
          icon: 'spa',
          color: '#FDCB6E',
          sort_order: 9,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'entertainment',
          title: 'Entertainment & Leisure',
          description: 'Cinemas, events, sports, and entertainment venues',
          icon: 'theaters',
          color: '#E17055',
          sort_order: 10,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'travel',
          title: 'Travel & Tourism',
          description: 'Hotels, travel agencies, and tourism services',
          icon: 'flight',
          color: '#74B9FF',
          sort_order: 11,
          is_active: true,
          ad_count: 0
        },
        {
          key: 'services',
          title: 'Professional Services',
          description: 'Legal, consulting, marketing, and professional services',
          icon: 'business',
          color: '#55A3FF',
          sort_order: 12,
          is_active: true,
          ad_count: 0
        }
      ];

      // Create all sections
      await Section.bulkCreate(sections);
      console.log('✅ Sections created successfully');
    } else {
      console.log('✅ Sections already exist');
    }

    // Display final sections
    const allSections = await Section.findAll({
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'is_active', 'ad_count']
    });

    console.log('\n📋 Business Sections:');
    allSections.forEach(section => {
      console.log(`  ${section.id}. ${section.title} (${section.key}) - Active: ${section.is_active}`);
    });

    console.log(`\n✅ Total sections: ${allSections.length}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error populating sections:', error);
    process.exit(1);
  }
}

// Run the population script
if (require.main === module) {
  populateSections();
}

module.exports = { populateSections };
