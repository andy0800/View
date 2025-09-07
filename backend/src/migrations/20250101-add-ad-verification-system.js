// backend/src/migrations/20250101-add-ad-verification-system.js
// Migration to add ad verification system

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add verification fields to existing ads table
    await queryInterface.addColumn('ads', 'verification_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'under_appeal'),
      defaultValue: 'pending',
      allowNull: false
    });

    await queryInterface.addColumn('ads', 'verified_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('ads', 'verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'admin_notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'submitted_for_review_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'review_deadline', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'appeal_deadline', {
      type: Sequelize.DATE,
      allowNull: true
    });

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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      advertiser_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
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
        defaultValue: 'pending',
        allowNull: false
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
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewed_at: {
        type: Sequelize.DATE,
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

    // Create ad_verification_history table
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.ENUM('submitted', 'approved', 'rejected', 'appeal_submitted', 'appeal_approved', 'appeal_rejected'),
        allowNull: false
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('ads', ['verification_status']);
    await queryInterface.addIndex('ads', ['submitted_for_review_at']);
    await queryInterface.addIndex('ad_appeals', ['ad_id']);
    await queryInterface.addIndex('ad_appeals', ['status']);
    await queryInterface.addIndex('ad_verification_history', ['ad_id']);
    await queryInterface.addIndex('ad_verification_history', ['action']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('ads', ['verification_status']);
    await queryInterface.removeIndex('ads', ['submitted_for_review_at']);
    await queryInterface.removeIndex('ad_appeals', ['ad_id']);
    await queryInterface.removeIndex('ad_appeals', ['status']);
    await queryInterface.removeIndex('ad_verification_history', ['ad_id']);
    await queryInterface.removeIndex('ad_verification_history', ['action']);

    // Drop tables
    await queryInterface.dropTable('ad_verification_history');
    await queryInterface.dropTable('ad_appeals');

    // Remove columns from ads table
    await queryInterface.removeColumn('ads', 'appeal_deadline');
    await queryInterface.removeColumn('ads', 'review_deadline');
    await queryInterface.removeColumn('ads', 'submitted_for_review_at');
    await queryInterface.removeColumn('ads', 'rejection_reason');
    await queryInterface.removeColumn('ads', 'admin_notes');
    await queryInterface.removeColumn('ads', 'verified_at');
    await queryInterface.removeColumn('ads', 'verified_by');
    await queryInterface.removeColumn('ads', 'verification_status');
  }
};
