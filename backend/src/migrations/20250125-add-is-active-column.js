'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Adding is_active column to users table...');
    
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.is_active) {
      await queryInterface.addColumn('users', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Account status - whether user is active'
      });
      console.log('✅ is_active column added to users table');
    } else {
      console.log('ℹ️ is_active column already exists in users table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing is_active column from users table...');
    
    // Check if column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.is_active) {
      await queryInterface.removeColumn('users', 'is_active');
      console.log('✅ is_active column removed from users table');
    } else {
      console.log('ℹ️ is_active column does not exist in users table');
    }
  }
};
