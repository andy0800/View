// Test script to verify sections API is working
const { Section } = require('../src/models');

async function testSections() {
  try {
    console.log('🔍 Testing sections functionality...');
    
    // Test 1: Database direct access
    console.log('\n📊 Test 1: Database Direct Access');
    const sections = await Section.findAll({
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'is_active', 'ad_count']
    });
    
    console.log(`✅ Found ${sections.length} sections in database:`);
    sections.forEach(section => {
      console.log(`  ${section.id}. ${section.title} (${section.key}) - Active: ${section.is_active}`);
    });
    
    // Test 2: Sections Controller simulation
    console.log('\n📊 Test 2: Controller Logic Simulation');
    const activeSections = await Section.findAll({ 
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'description', 'icon', 'color', 'ad_count']
    });
    
    console.log(`✅ Active sections: ${activeSections.length}`);
    activeSections.slice(0, 3).forEach(section => {
      console.log(`  - ${section.title}: ${section.description.substring(0, 50)}...`);
    });
    
    // Test 3: Check section keys match frontend expectations
    console.log('\n📊 Test 3: Frontend Integration Check');
    const expectedKeys = [
      'restaurants', 'retail', 'automotive', 'healthcare', 
      'education', 'real_estate', 'finance', 'technology',
      'beauty', 'entertainment', 'travel', 'services'
    ];
    
    const existingKeys = sections.map(s => s.key);
    const missingKeys = expectedKeys.filter(key => !existingKeys.includes(key));
    const extraKeys = existingKeys.filter(key => !expectedKeys.includes(key));
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log('✅ All expected sections present and matching frontend');
    } else {
      if (missingKeys.length > 0) {
        console.log('⚠️ Missing sections:', missingKeys);
      }
      if (extraKeys.length > 0) {
        console.log('⚠️ Extra sections:', extraKeys);
      }
    }
    
    console.log('\n✅ Sections test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing sections:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testSections();
}

module.exports = { testSections };
