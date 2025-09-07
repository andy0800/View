require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkSections() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check sections table
    const [sections] = await sequelize.query(`
      SELECT * FROM sections
    `);

    console.log('\n📋 Available Sections:');
    console.log('-'.repeat(40));
    
    if (sections.length === 0) {
      console.log('❌ No sections found in database');
    } else {
      sections.forEach(section => {
        console.log(`- ${section.name} (${section.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkSections();
