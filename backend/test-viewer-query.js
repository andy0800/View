require('dotenv').config();
const { sequelize, Ad, PurchasedPackage, AdvertiserPackage, User } = require('./src/models');
const { Op } = require('sequelize');

async function testViewerQuery() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🔍 Testing the exact query from viewer controller...');

    // Test the exact query from getAllAds
    const ads = await Ad.findAll({
      where: {
        status: ['active', 'approved'],
        is_active: true,
        verification_status: 'approved'
      },
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [Op.gt]: 0 }
          },
          include: [{
            model: AdvertiserPackage,
            as: 'package'
          }]
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['name', 'company_name']
        }
      ],
      order: sequelize.random(),
      limit: 20,
      offset: 0
    });

    console.log(`\n📹 Query result: Found ${ads.length} ads`);
    
    if (ads.length > 0) {
      ads.forEach((ad, index) => {
        console.log(`\n--- Ad ${index + 1} ---`);
        console.log(`   ID: ${ad.id}`);
        console.log(`   Title: ${ad.title}`);
        console.log(`   Status: ${ad.status}`);
        console.log(`   Active: ${ad.is_active}`);
        console.log(`   Verification: ${ad.verification_status}`);
        console.log(`   Section: ${ad.section}`);
        
        if (ad.purchasedPackage) {
          console.log(`   Purchased Package ID: ${ad.purchasedPackage.id}`);
          console.log(`   Remaining Budget: ${ad.purchasedPackage.remaining_budget}`);
          console.log(`   Package Status: ${ad.purchasedPackage.status}`);
          
          if (ad.purchasedPackage.package) {
            console.log(`   Package Name: ${ad.purchasedPackage.package.name}`);
            console.log(`   Duration: ${ad.purchasedPackage.package.duration}`);
          } else {
            console.log(`   ❌ Package association missing`);
          }
        } else {
          console.log(`   ❌ PurchasedPackage association missing`);
        }
        
        if (ad.advertiser) {
          console.log(`   Advertiser: ${ad.advertiser.name}`);
          console.log(`   Company: ${ad.advertiser.company_name}`);
        } else {
          console.log(`   ❌ Advertiser association missing`);
        }
      });
    } else {
      console.log('❌ No ads found - this explains why viewers see no ads!');
    }

    // Let's also check the raw SQL to see what's happening
    console.log('\n🔍 Checking raw SQL query...');
    const [rawAds] = await sequelize.query(`
      SELECT 
        a.id,
        a.title,
        a.status,
        a.is_active,
        a.verification_status,
        a.section,
        pp.id as purchased_package_id,
        pp.remaining_budget,
        pp.status as package_status,
        ap.name as package_name,
        ap.duration,
        u.name as advertiser_name,
        u.company_name
      FROM ads a
      LEFT JOIN purchased_packages pp ON a.purchased_package_id = pp.id
      LEFT JOIN advertiser_packages ap ON pp.package_id = ap.id
      LEFT JOIN users u ON a.advertiser_id = u.id
      WHERE a.status IN ('active', 'approved')
        AND a.is_active = true
        AND a.verification_status = 'approved'
        AND pp.remaining_budget > 0
      ORDER BY RANDOM()
      LIMIT 20
    `);

    console.log(`\n📹 Raw SQL result: Found ${rawAds.length} ads`);
    if (rawAds.length > 0) {
      rawAds.forEach((ad, index) => {
        console.log(`\n--- Raw Ad ${index + 1} ---`);
        console.log(`   ID: ${ad.id}`);
        console.log(`   Title: ${ad.title}`);
        console.log(`   Status: ${ad.status}`);
        console.log(`   Active: ${ad.is_active}`);
        console.log(`   Verification: ${ad.verification_status}`);
        console.log(`   Section: ${ad.section}`);
        console.log(`   Package ID: ${ad.purchased_package_id}`);
        console.log(`   Remaining Budget: ${ad.remaining_budget}`);
        console.log(`   Package Status: ${ad.package_status}`);
        console.log(`   Package Name: ${ad.package_name}`);
        console.log(`   Duration: ${ad.duration}`);
        console.log(`   Advertiser: ${ad.advertiser_name}`);
        console.log(`   Company: ${ad.company_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

testViewerQuery();
