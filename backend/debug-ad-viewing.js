require('dotenv').config();
const { sequelize, User, Ad } = require('./src/models');
const TestUtils = require('./pressure-test/test-utils');

async function debugAdViewing() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const testUtils = new TestUtils();

    // Check ads
    const ads = await Ad.findAll({
      where: { status: 'active', is_active: true },
      attributes: ['id', 'title', 'status', 'is_active', 'advertiser_id']
    });

    console.log(`\n📹 Active ads found: ${ads.length}`);
    ads.forEach(ad => {
      console.log(`   - ID: ${ad.id}, Title: ${ad.title}, Status: ${ad.status}, Active: ${ad.is_active}`);
    });

    if (ads.length === 0) {
      console.log('❌ No active ads found!');
      return;
    }

    // Check viewers
    const viewers = await User.findAll({
      where: {
        phone: { [require('sequelize').Op.like]: '+965500%' },
        role: 'viewer'
      },
      attributes: ['id', 'name', 'phone'],
      limit: 3
    });

    console.log(`\n👥 Test viewers: ${viewers.length}`);
    viewers.forEach(viewer => {
      console.log(`   - ${viewer.phone}: ${viewer.name}`);
    });

    // Test with first viewer
    if (viewers.length > 0) {
      const testViewer = viewers[0];
      console.log(`\n🧪 Testing with viewer: ${testViewer.phone}`);

      // Login
      console.log('🔐 Logging in...');
      await testUtils.loginWithOtp(testViewer.phone);

      // Get available ads
      console.log('🔍 Getting available ads...');
      const adsResult = await testUtils.getAvailableAds(testViewer.phone);
      
      console.log('📊 Ads result:', {
        success: adsResult.success,
        status: adsResult.status,
        dataLength: adsResult.data?.data?.length || 0
      });

      if (adsResult.success && adsResult.data?.data?.length > 0) {
        const availableAd = adsResult.data.data[0];
        console.log(`\n✅ Found available ad: ${availableAd.title} (ID: ${availableAd.id})`);

        // Try to start watching
        console.log('▶️ Starting to watch ad...');
        const startResult = await testUtils.startWatchingAd(testViewer.phone, availableAd.id);
        
        console.log('📊 Start result:', {
          success: startResult.success,
          status: startResult.status,
          proofToken: startResult.data?.data?.proofToken ? 'Present' : 'Missing'
        });

        if (startResult.success && startResult.data?.data?.proofToken) {
          const proofToken = startResult.data.data.proofToken;
          console.log(`\n⏱️ Simulating watch duration...`);
          
          // Wait a bit
          await testUtils.sleep(3000);
          
          // Complete watching
          console.log('✅ Completing ad view...');
          const completeResult = await testUtils.completeWatchingAd(testViewer.phone, proofToken);
          
          console.log('📊 Complete result:', {
            success: completeResult.success,
            status: completeResult.status,
            reward: completeResult.data?.data?.reward || 'Not provided'
          });
        }
      } else {
        console.log('❌ No ads available for viewer');
        console.log('Full response:', JSON.stringify(adsResult, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

debugAdViewing();
