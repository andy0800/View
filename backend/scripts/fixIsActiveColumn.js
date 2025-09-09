const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.DB_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function fixIsActiveColumn() {
  try {
    console.log('🔍 Checking if is_active column exists in users table...');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
      AND table_schema = 'public'
    `);
    
    if (results.length === 0) {
      console.log('❌ is_active column does not exist. Adding it now...');
      
      // Add the column
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      
      // Add comment
      await sequelize.query(`
        COMMENT ON COLUMN users.is_active IS 'Account status - whether user is active'
      `);
      
      console.log('✅ is_active column added successfully!');
    } else {
      console.log('ℹ️ is_active column already exists in users table');
    }
    
    // Verify the column was added
    const [verifyResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
      AND table_schema = 'public'
    `);
    
    if (verifyResults.length > 0) {
      console.log('✅ Verification successful:');
      console.log('   Column:', verifyResults[0].column_name);
      console.log('   Type:', verifyResults[0].data_type);
      console.log('   Nullable:', verifyResults[0].is_nullable);
      console.log('   Default:', verifyResults[0].column_default);
    }
    
  } catch (error) {
    console.error('❌ Error fixing is_active column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixIsActiveColumn()
  .then(() => {
    console.log('🎉 is_active column fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 is_active column fix failed:', error);
    process.exit(1);
  });
