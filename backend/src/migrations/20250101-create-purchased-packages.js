// backend/src/migrations/20250101-create-purchased-packages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create purchased_packages table
    await queryInterface.createTable('purchased_packages', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      advertiser_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      package_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'advertiser_packages', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      purchased_budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      estimated_views: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      remaining_budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      used_budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('active', 'used', 'expired'),
        allowNull: false,
        defaultValue: 'active'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Add indexes for better performance
    await queryInterface.addIndex('purchased_packages', ['advertiser_id']);
    await queryInterface.addIndex('purchased_packages', ['package_id']);
    await queryInterface.addIndex('purchased_packages', ['status']);

    // Add purchased_package_id field to ads table
    await queryInterface.addColumn('ads', 'purchased_package_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'purchased_packages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for the new field
    await queryInterface.addIndex('ads', ['purchased_package_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove purchased_package_id field from ads table
    await queryInterface.removeColumn('ads', 'purchased_package_id');
    
    // Drop purchased_packages table
    await queryInterface.dropTable('purchased_packages');
  }
};
