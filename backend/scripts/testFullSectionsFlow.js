// Test script to verify complete sections functionality
const { Section, Ad, sequelize } = require('../src/models');
const http = require('http');

async function testSectionsFlow() {
  try {
    console.log('🔍 Testing complete sections functionality...');
    
    // Test 1: Database sections
    console.log('\n📊 Test 1: Database Sections');
    const sections = await Section.findAll({
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'is_active', 'ad_count', 'color']
    });
    
    console.log(`✅ Found ${sections.length} sections in database:`);
    sections.forEach(section => {
      console.log(`  ${section.id}. ${section.title} (${section.key}) - Active: ${section.is_active} - Color: ${section.color}`);
    });
    
    // Test 2: Check ad-section relationships
    console.log('\n📊 Test 2: Ad-Section Relationships');
    const totalAds = await Ad.count();
    console.log(`📈 Total ads in database: ${totalAds}`);
    
    if (totalAds > 0) {
      const adSections = await Ad.findAll({
        attributes: ['section'],
        group: ['section'],
        raw: true
      });
      
      console.log('📋 Sections used by ads:');
      adSections.forEach(adSection => {
        console.log(`  - ${adSection.section}`);
      });
    } else {
      console.log('ℹ️ No ads found - this is expected if no ads have been created yet');
    }
    
    // Test 3: Simulate API response structure
    console.log('\n📊 Test 3: API Response Structure');
    const activeSections = await Section.findAll({ 
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'description', 'icon', 'color', 'ad_count']
    });
    
    console.log('🔗 API response structure:');
    console.log(JSON.stringify(activeSections.slice(0, 2), null, 2));
    
    // Test 4: Check sections API endpoint if backend is running
    console.log('\n📊 Test 4: Testing API Endpoint');
    
    const testAPI = () => {
      return new Promise((resolve) => {
        const req = http.request('http://localhost:4001/api/sections', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const apiSections = JSON.parse(data);
              console.log('✅ API Response successful:');
              console.log(`  - Status: ${res.statusCode}`);
              console.log(`  - Sections count: ${apiSections.length}`);
              if (apiSections.length > 0) {
                console.log(`  - First section: ${apiSections[0].title} (${apiSections[0].key})`);
              }
              resolve(true);
            } catch (e) {
              console.log('❌ API Response parsing error:', e.message);
              console.log('Raw response:', data.substring(0, 200));
              resolve(false);
            }
          });
        });
        
        req.on('error', (e) => {
          console.log('❌ API Request failed:', e.message);
          console.log('ℹ️ This is expected if backend is not running');
          resolve(false);
        });
        
        req.setTimeout(3000, () => {
          console.log('⏱️ API Request timeout - backend may not be running');
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    };
    
    await testAPI();
    
    // Test 5: Frontend Integration Check
    console.log('\n📊 Test 5: Frontend Integration Check');
    const expectedTranslationKeys = [
      'restaurants', 'retail', 'automotive', 'healthcare', 
      'education', 'real_estate', 'finance', 'technology',
      'beauty', 'entertainment', 'travel', 'services'
    ];
    
    const existingKeys = sections.map(s => s.key);
    const missingKeys = expectedTranslationKeys.filter(key => !existingKeys.includes(key));
    const extraKeys = existingKeys.filter(key => !expectedTranslationKeys.includes(key));
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log('✅ All expected sections present and matching frontend expectations');
    } else {
      if (missingKeys.length > 0) {
        console.log('⚠️ Missing sections:', missingKeys);
      }
      if (extraKeys.length > 0) {
        console.log('⚠️ Extra sections:', extraKeys);
      }
    }
    
    console.log('\n✅ Complete sections flow test completed!');
    console.log('\n📋 Summary:');
    console.log(`  - Database sections: ${sections.length}`);
    console.log(`  - Active sections: ${activeSections.length}`);
    console.log(`  - Total ads: ${totalAds}`);
    console.log(`  - Frontend integration: ${missingKeys.length === 0 ? '✅ Ready' : '⚠️ Needs attention'}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing sections flow:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testSectionsFlow();
}

module.exports = { testSectionsFlow };
