#!/usr/bin/env node
// Check if CTA fields exist in the ads table

const { sequelize } = require('./src/models');

async function checkCTAFields() {
  try {
    console.log('🔍 Checking CTA fields in ads table...\n');
    
    // Check table structure
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ads' 
      AND column_name IN ('cta_enabled', 'cta_link', 'cta_text')
      ORDER BY column_name;
    `);
    
    console.log('📊 CTA Fields Status:');
    if (results.length === 0) {
      console.log('❌ No CTA fields found in ads table');
      console.log('   - cta_enabled: MISSING');
      console.log('   - cta_link: MISSING');
      console.log('   - cta_text: MISSING');
    } else {
      results.forEach(field => {
        console.log(`✅ ${field.column_name}: ${field.data_type} (nullable: ${field.is_nullable})`);
      });
    }
    
    // Check if any ads have CTA data
    const [ctaData] = await sequelize.query(`
      SELECT COUNT(*) as total_ads,
             COUNT(CASE WHEN cta_enabled = true THEN 1 END) as cta_enabled_count,
             COUNT(CASE WHEN cta_link IS NOT NULL AND cta_link != '' THEN 1 END) as cta_link_count,
             COUNT(CASE WHEN cta_text IS NOT NULL AND cta_text != '' THEN 1 END) as cta_text_count
      FROM ads;
    `);
    
    console.log('\n📊 CTA Data in Ads:');
    console.log(`   Total Ads: ${ctaData[0].total_ads}`);
    console.log(`   CTA Enabled: ${ctaData[0].cta_enabled_count}`);
    console.log(`   CTA Link: ${ctaData[0].cta_link_count}`);
    console.log(`   CTA Text: ${ctaData[0].cta_text_count}`);
    
    // Check sample ad data
    const [sampleAds] = await sequelize.query(`
      SELECT id, title, cta_enabled, cta_link, cta_text
      FROM ads 
      LIMIT 3;
    `);
    
    console.log('\n📋 Sample Ad CTA Data:');
    sampleAds.forEach(ad => {
      console.log(`   Ad ID: ${ad.id}`);
      console.log(`   Title: ${ad.title}`);
      console.log(`   CTA Enabled: ${ad.cta_enabled}`);
      console.log(`   CTA Link: ${ad.cta_link || 'NULL'}`);
      console.log(`   CTA Text: ${ad.cta_text || 'NULL'}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error checking CTA fields:', error);
  } finally {
    await sequelize.close();
  }
}

checkCTAFields();

