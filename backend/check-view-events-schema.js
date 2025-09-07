require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkViewEventsSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check view_events table schema
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'view_events'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 View Events Table Schema:');
    console.log('-'.repeat(50));
    results.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Also check if the table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%view%';
    `);

    console.log('\n📋 Tables with "view" in name:');
    console.log('-'.repeat(30));
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkViewEventsSchema();
