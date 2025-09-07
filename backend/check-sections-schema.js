require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkSectionsSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check sections table schema
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sections'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Sections Table Schema:');
    console.log('-'.repeat(70));
    results.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${column.column_default || 'none'}`);
    });

    // Get sample data
    const [sampleData] = await sequelize.query(`
      SELECT * FROM sections LIMIT 3;
    `);

    console.log('\n📋 Sample Section Data:');
    console.log('-'.repeat(40));
    if (sampleData.length > 0) {
      Object.entries(sampleData[0]).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkSectionsSchema();
