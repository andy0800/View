// backend/src/migrations/20241231-add-foreign-keys.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key constraints
    await queryInterface.addConstraint('videos', {
      fields: ['advertiser_id'],
      type: 'foreign key',
      name: 'videos_advertiser_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('view_events', {
      fields: ['video_id'],
      type: 'foreign key',
      name: 'view_events_video_id_fkey',
      references: {
        table: 'videos',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION'
    });

    await queryInterface.addConstraint('view_events', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'view_events_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('wallets', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'wallets_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('wallets', 'wallets_user_id_fkey');
    await queryInterface.removeConstraint('view_events', 'view_events_user_id_fkey');
    await queryInterface.removeConstraint('view_events', 'view_events_video_id_fkey');
    await queryInterface.removeConstraint('videos', 'videos_advertiser_id_fkey');
  }
};
