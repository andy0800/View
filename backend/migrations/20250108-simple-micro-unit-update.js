'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Starting simple micro-unit migration...');

    try {
      // 1. Add essential micro-unit columns to advertiser_packages
      console.log('📦 Adding micro-unit columns to advertiser_packages...');
      await queryInterface.addColumn('advertiser_packages', 'price_per_view_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Price per view in micro units (1,000,000 = 1 KWD)'
      });

      // 2. Add essential micro-unit columns to purchased_packages
      console.log('📦 Adding micro-unit columns to purchased_packages...');
      await queryInterface.addColumn('purchased_packages', 'budget_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Budget in micro units (1,000,000 = 1 KWD)'
      });
      await queryInterface.addColumn('purchased_packages', 'remaining_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Remaining budget in micro units'
      });
      await queryInterface.addColumn('purchased_packages', 'used_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
        comment: 'Used budget in micro units'
      });
      await queryInterface.addColumn('purchased_packages', 'expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When package expires'
      });

      // 3. Add essential micro-unit columns to wallets
      console.log('💰 Adding micro-unit columns to wallets...');
      await queryInterface.addColumn('wallets', 'balance_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
        comment: 'Balance in micro units (1,000,000 = 1 KWD)'
      });
      await queryInterface.addColumn('wallets', 'held_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
        comment: 'Held balance in micro units'
      });

      // 4. Add essential micro-unit columns to transactions
      console.log('💳 Adding micro-unit columns to transactions...');
      await queryInterface.addColumn('transactions', 'amount_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Transaction amount in micro units'
      });

      // 5. Add essential micro-unit columns to view_events
      console.log('👁️ Adding micro-unit columns to view_events...');
      await queryInterface.addColumn('view_events', 'charged_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Amount charged in micro units'
      });
      await queryInterface.addColumn('view_events', 'viewer_reward_micro', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Viewer reward in micro units'
      });

      console.log('✅ Simple micro-unit migration completed successfully!');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back simple migration...');
    
    try {
      // Remove added columns
      await queryInterface.removeColumn('advertiser_packages', 'price_per_view_micro');
      await queryInterface.removeColumn('purchased_packages', 'budget_micro');
      await queryInterface.removeColumn('purchased_packages', 'remaining_micro');
      await queryInterface.removeColumn('purchased_packages', 'used_micro');
      await queryInterface.removeColumn('purchased_packages', 'expires_at');
      await queryInterface.removeColumn('wallets', 'balance_micro');
      await queryInterface.removeColumn('wallets', 'held_micro');
      await queryInterface.removeColumn('transactions', 'amount_micro');
      await queryInterface.removeColumn('view_events', 'charged_micro');
      await queryInterface.removeColumn('view_events', 'viewer_reward_micro');
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
