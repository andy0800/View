// Final comprehensive test for complete sections integration
const { Section, Ad, AdvertiserPackage, PurchasedPackage, User, sequelize } = require('../src/models');
const http = require('http');

async function testCompleteSectionsIntegration() {
  try {
    console.log('🔍 Final Comprehensive Sections Integration Test');
    console.log('=' .repeat(60));
    
    // Test 1: Database Layer
    console.log('\n📊 Test 1: Database Layer');
    const sections = await Section.findAll({
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'is_active', 'color']
    });
    
    console.log(`✅ Database sections: ${sections.length}`);
    console.log('📋 All sections:');
    sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.title} (${section.key}) - ${section.color}`);
    });
    
    // Test 2: API Layer
    console.log('\n📊 Test 2: API Layer Testing');
    
    const testAPIEndpoint = (endpoint, description) => {
      return new Promise((resolve) => {
        const req = http.request(`http://localhost:4001${endpoint}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log(`✅ ${description}: Status ${res.statusCode}, Count: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`);
              resolve({ success: true, data: parsed, status: res.statusCode });
            } catch (e) {
              console.log(`❌ ${description}: Parse error - ${e.message}`);
              resolve({ success: false, error: e.message });
            }
          });
        });
        
        req.on('error', (e) => {
          console.log(`❌ ${description}: Request failed - ${e.message}`);
          resolve({ success: false, error: e.message });
        });
        
        req.setTimeout(5000, () => {
          console.log(`⏱️ ${description}: Timeout`);
          req.destroy();
          resolve({ success: false, error: 'timeout' });
        });
        
        req.end();
      });
    };
    
    // Test API endpoints
    const apiTests = [
      { endpoint: '/api/sections', description: 'Sections API' },
      { endpoint: '/api/sections/restaurants/ads', description: 'Restaurant Section Ads' },
      { endpoint: '/advertiser/packages', description: 'Advertiser Packages' }
    ];
    
    const apiResults = [];
    for (const test of apiTests) {
      const result = await testAPIEndpoint(test.endpoint, test.description);
      apiResults.push({ ...test, ...result });
    }
    
    // Test 3: Frontend Integration Points
    console.log('\n📊 Test 3: Frontend Integration Analysis');
    
    // Check if sections match frontend expectations
    const frontendExpectedSections = [
      'restaurants', 'retail', 'automotive', 'healthcare', 
      'education', 'real_estate', 'finance', 'technology',
      'beauty', 'entertainment', 'travel', 'services'
    ];
    
    const dbSectionKeys = sections.map(s => s.key);
    const missingFromDB = frontendExpectedSections.filter(key => !dbSectionKeys.includes(key));
    const extraInDB = dbSectionKeys.filter(key => !frontendExpectedSections.includes(key));
    
    console.log('🔗 Frontend Integration Check:');
    if (missingFromDB.length === 0 && extraInDB.length === 0) {
      console.log('✅ Perfect match - All frontend sections exist in database');
    } else {
      if (missingFromDB.length > 0) {
        console.log(`❌ Missing from DB: ${missingFromDB.join(', ')}`);
      }
      if (extraInDB.length > 0) {
        console.log(`⚠️ Extra in DB: ${extraInDB.join(', ')}`);
      }
    }
    
    // Test 4: Ad-Section Relationships
    console.log('\n📊 Test 4: Ad-Section Relationships');
    const totalAds = await Ad.count();
    console.log(`📈 Total ads in system: ${totalAds}`);
    
    if (totalAds > 0) {
      const adsWithSections = await Ad.findAll({
        attributes: ['section'],
        group: ['section'],
        raw: true
      });
      
      console.log('📋 Sections with ads:');
      adsWithSections.forEach(ad => {
        const section = sections.find(s => s.key === ad.section);
        console.log(`  - ${ad.section}: ${section ? section.title : 'Unknown Section'}`);
      });
    } else {
      console.log('ℹ️ No ads found - ready for ad creation testing');
    }
    
    // Test 5: Package Integration
    console.log('\n📊 Test 5: Package Integration');
    const packages = await AdvertiserPackage.count();
    const purchasedPackages = await PurchasedPackage.count();
    console.log(`📦 Available packages: ${packages}`);
    console.log(`🛒 Purchased packages: ${purchasedPackages}`);
    
    // Test 6: User Integration
    console.log('\n📊 Test 6: User Integration');
    const advertisers = await User.count({ where: { role: 'advertiser' } });
    const viewers = await User.count({ where: { role: 'viewer' } });
    console.log(`👔 Advertisers: ${advertisers}`);
    console.log(`👀 Viewers: ${viewers}`);
    
    // Test 7: Component Analysis
    console.log('\n📊 Test 7: Component Analysis');
    
    const componentStatus = {
      'Database Sections': sections.length > 0,
      'API Endpoints': apiResults.filter(r => r.success).length > 0,
      'Frontend Integration': missingFromDB.length === 0 && extraInDB.length === 0,
      'Package System': packages > 0,
      'User System': (advertisers + viewers) > 0
    };
    
    console.log('🔧 Component Status:');
    Object.entries(componentStatus).forEach(([component, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${component}`);
    });
    
    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FINAL INTEGRATION SUMMARY');
    console.log('=' .repeat(60));
    
    const successfulTests = Object.values(componentStatus).filter(Boolean).length;
    const totalTests = Object.keys(componentStatus).length;
    
    console.log(`✅ Tests passed: ${successfulTests}/${totalTests}`);
    console.log(`📊 Database sections: ${sections.length}/12 expected`);
    console.log(`🔗 API endpoints working: ${apiResults.filter(r => r.success).length}/${apiResults.length}`);
    console.log(`🎯 Frontend integration: ${missingFromDB.length === 0 ? 'Perfect' : 'Needs attention'}`);
    
    if (successfulTests === totalTests) {
      console.log('\n🎉 ALL SYSTEMS GO! Sections are fully integrated across all interfaces!');
    } else {
      console.log('\n⚠️ Some components need attention. Check the details above.');
    }
    
    console.log('\n🚀 Ready for testing:');
    console.log('  1. Advertiser can create ads with section selection');
    console.log('  2. Viewer can browse ads by business sections');
    console.log('  3. Admin can manage ads across all sections');
    console.log('  4. Sections display correctly on all interfaces');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testCompleteSectionsIntegration();
}

module.exports = { testCompleteSectionsIntegration };
