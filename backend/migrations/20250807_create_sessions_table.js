'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ip_address: {
        type: Sequelize.STRING(45), // IPv6 compatible
        allowNull: false
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_activity: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

    // Create indexes for better performance
    await queryInterface.addIndex('sessions', ['user_id']);
    await queryInterface.addIndex('sessions', ['token']);
    await queryInterface.addIndex('sessions', ['ip_address']);
    await queryInterface.addIndex('sessions', ['expires_at']);
    await queryInterface.addIndex('sessions', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sessions');
  }
}; 