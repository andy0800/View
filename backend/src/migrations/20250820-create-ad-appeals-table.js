// backend/src/migrations/20250820-create-ad-appeals-table.js
// Migration to create the ad_appeals table for the appeal system

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ad_appeals table
    await queryInterface.createTable('ad_appeals', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      ad_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ads',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      advertiser_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      appeal_reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      appeal_evidence: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      admin_response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      appeal_deadline: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Deadline for admin to respond to appeal (7 days)'
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

    // Create ad_verification_history table if it doesn't exist
    await queryInterface.createTable('ad_verification_history', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      ad_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ads',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.ENUM('approved', 'rejected', 'appealed', 'appeal_approved', 'appeal_rejected'),
        allowNull: false
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional data like rejection reason, appeal details, etc.'
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Add indexes for performance
    await queryInterface.addIndex('ad_appeals', ['ad_id']);
    await queryInterface.addIndex('ad_appeals', ['advertiser_id']);
    await queryInterface.addIndex('ad_appeals', ['status']);
    await queryInterface.addIndex('ad_appeals', ['reviewed_by']);
    await queryInterface.addIndex('ad_appeals', ['appeal_deadline']);

    await queryInterface.addIndex('ad_verification_history', ['ad_id']);
    await queryInterface.addIndex('ad_verification_history', ['admin_id']);
    await queryInterface.addIndex('ad_verification_history', ['action']);
    await queryInterface.addIndex('ad_verification_history', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('ad_appeals', ['ad_id']);
    await queryInterface.removeIndex('ad_appeals', ['advertiser_id']);
    await queryInterface.removeIndex('ad_appeals', ['status']);
    await queryInterface.removeIndex('ad_appeals', ['reviewed_by']);
    await queryInterface.removeIndex('ad_appeals', ['appeal_deadline']);

    await queryInterface.removeIndex('ad_verification_history', ['ad_id']);
    await queryInterface.removeIndex('ad_verification_history', ['admin_id']);
    await queryInterface.removeIndex('ad_verification_history', ['action']);
    await queryInterface.removeIndex('ad_verification_history', ['created_at']);

    // Drop tables
    await queryInterface.dropTable('ad_verification_history');
    await queryInterface.dropTable('ad_appeals');
  }
};
