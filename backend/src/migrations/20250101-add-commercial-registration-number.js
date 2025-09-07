// backend/src/migrations/20250101-add-commercial-registration-number.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add commercial_registration_number column to users table
      await queryInterface.addColumn('users', 'commercial_registration_number', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'license_number'
      });

      console.log('✅ Added commercial_registration_number column to users table');
    } catch (error) {
      console.error('❌ Error adding commercial_registration_number column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove commercial_registration_number column from users table
      await queryInterface.removeColumn('users', 'commercial_registration_number');
      
      console.log('✅ Removed commercial_registration_number column from users table');
    } catch (error) {
      console.error('❌ Error removing commercial_registration_number column:', error);
      throw error;
    }
  }
};
