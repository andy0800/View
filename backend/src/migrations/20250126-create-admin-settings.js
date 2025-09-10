// backend/src/migrations/20250126-create-admin-settings.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Creating admin_settings table...');

    await queryInterface.createTable('admin_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Setting key identifier'
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Setting value (JSON string for complex objects)'
      },
      category: {
        type: Sequelize.ENUM('notification', 'system', 'security', 'business'),
        allowNull: false,
        defaultValue: 'system',
        comment: 'Setting category for organization'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description of the setting'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the setting is active'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Admin who last updated this setting'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('admin_settings', ['key'], {
      unique: true
    });
    await queryInterface.addIndex('admin_settings', ['category']);
    await queryInterface.addIndex('admin_settings', ['is_active']);

    console.log('✅ admin_settings table created successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Dropping admin_settings table...');
    
    await queryInterface.dropTable('admin_settings');
    
    console.log('✅ admin_settings table dropped successfully!');
  }
};
