'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Adding missing essential columns...');

    try {
      // Add version column to purchased_packages for optimistic locking
      console.log('📦 Adding version column to purchased_packages...');
      await queryInterface.addColumn('purchased_packages', 'version', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Optimistic locking version for concurrency control'
      });

      // Add views_completed column to purchased_packages
      console.log('📦 Adding views_completed column to purchased_packages...');
      await queryInterface.addColumn('purchased_packages', 'views_completed', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Number of views completed'
      });

      // Add missing columns to view_events
      console.log('👁️ Adding missing columns to view_events...');
      await queryInterface.addColumn('view_events', 'purchased_package_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to purchased package'
      });

      await queryInterface.addColumn('view_events', 'proof_token', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'HMAC proof token for view validation'
      });

      await queryInterface.addColumn('view_events', 'proof_token_expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When proof token expires'
      });

      await queryInterface.addColumn('view_events', 'company_share_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Company share in micro units'
      });

      await queryInterface.addColumn('view_events', 'watched_duration_ms', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Actual milliseconds watched'
      });

      await queryInterface.addColumn('view_events', 'required_duration_ms', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Required milliseconds from package'
      });

      // Add missing columns to transactions
      console.log('💳 Adding missing columns to transactions...');
      await queryInterface.addColumn('transactions', 'from_wallet_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Source wallet ID for the transaction'
      });

      await queryInterface.addColumn('transactions', 'to_wallet_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Destination wallet ID for the transaction'
      });

      await queryInterface.addColumn('transactions', 'status', {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
        allowNull: true,
        defaultValue: 'completed',
        comment: 'Transaction status'
      });

      await queryInterface.addColumn('transactions', 'meta', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional transaction metadata'
      });

      await queryInterface.addColumn('transactions', 'processed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When transaction was processed'
      });

      console.log('✅ Missing columns added successfully!');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back missing columns migration...');
    
    try {
      // Remove added columns
      await queryInterface.removeColumn('purchased_packages', 'version');
      await queryInterface.removeColumn('purchased_packages', 'views_completed');
      await queryInterface.removeColumn('view_events', 'purchased_package_id');
      await queryInterface.removeColumn('view_events', 'proof_token');
      await queryInterface.removeColumn('view_events', 'proof_token_expires_at');
      await queryInterface.removeColumn('view_events', 'company_share_micro');
      await queryInterface.removeColumn('view_events', 'watched_duration_ms');
      await queryInterface.removeColumn('view_events', 'required_duration_ms');
      await queryInterface.removeColumn('transactions', 'from_wallet_id');
      await queryInterface.removeColumn('transactions', 'to_wallet_id');
      await queryInterface.removeColumn('transactions', 'status');
      await queryInterface.removeColumn('transactions', 'meta');
      await queryInterface.removeColumn('transactions', 'processed_at');
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
