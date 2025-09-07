'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Starting numeric field overflow fix migration...');
    
    try {
      // Fix numeric field precision in purchased_packages table
      // Increase precision to handle larger values and prevent overflow
      
      console.log('📊 Updating purchased_packages table numeric fields...');
      
      // Update used_micro field - increase precision to handle larger values
      await queryInterface.changeColumn('purchased_packages', 'used_micro', {
        type: Sequelize.DECIMAL(20, 0), // Increased from BIGINT to handle larger values
        allowNull: false,
        defaultValue: 0,
        comment: 'Used budget in micro units (increased precision to prevent overflow)'
      });
      
      // Update used_budget field - increase precision for KWD values
      await queryInterface.changeColumn('purchased_packages', 'used_budget', {
        type: Sequelize.DECIMAL(15, 2), // Increased from DECIMAL(10,2) to handle larger values
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Used budget in KWD (increased precision to prevent overflow)'
      });
      
      // Update remaining_micro field
      await queryInterface.changeColumn('purchased_packages', 'remaining_micro', {
        type: Sequelize.DECIMAL(20, 0), // Increased from BIGINT
        allowNull: false,
        comment: 'Remaining budget in micro units (increased precision to prevent overflow)'
      });
      
      // Update remaining_budget field
      await queryInterface.changeColumn('purchased_packages', 'remaining_budget', {
        type: Sequelize.DECIMAL(15, 2), // Increased from DECIMAL(10,2)
        allowNull: false,
        comment: 'Remaining budget in KWD (increased precision to prevent overflow)'
      });
      
      // Update budget_micro field
      await queryInterface.changeColumn('purchased_packages', 'budget_micro', {
        type: Sequelize.DECIMAL(20, 0), // Increased from BIGINT
        allowNull: false,
        comment: 'Total budget in micro units (increased precision to prevent overflow)'
      });
      
      // Update purchased_budget field
      await queryInterface.changeColumn('purchased_packages', 'purchased_budget', {
        type: Sequelize.DECIMAL(15, 2), // Increased from DECIMAL(10,2)
        allowNull: false,
        comment: 'Total budget in KWD (increased precision to prevent overflow)'
      });
      
      console.log('✅ Successfully updated purchased_packages numeric fields');
      
      // Add indexes for better performance on budget-related queries
      console.log('📈 Adding performance indexes...');
      
      await queryInterface.addIndex('purchased_packages', ['remaining_micro'], {
        name: 'idx_purchased_packages_remaining_micro'
      });
      
      await queryInterface.addIndex('purchased_packages', ['used_micro'], {
        name: 'idx_purchased_packages_used_micro'
      });
      
      await queryInterface.addIndex('purchased_packages', ['status', 'remaining_micro'], {
        name: 'idx_purchased_packages_status_remaining'
      });
      
      console.log('✅ Successfully added performance indexes');
      
      console.log('🎯 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back numeric field overflow fix...');
    
    try {
      // Revert numeric field changes back to original precision
      
      console.log('📊 Reverting purchased_packages table numeric fields...');
      
      // Revert used_micro field
      await queryInterface.changeColumn('purchased_packages', 'used_micro', {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Used budget in micro units'
      });
      
      // Revert used_budget field
      await queryInterface.changeColumn('purchased_packages', 'used_budget', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Used budget in KWD'
      });
      
      // Revert remaining_micro field
      await queryInterface.changeColumn('purchased_packages', 'remaining_micro', {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Remaining budget in micro units'
      });
      
      // Revert remaining_budget field
      await queryInterface.changeColumn('purchased_packages', 'remaining_budget', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Remaining budget in KWD'
      });
      
      // Revert budget_micro field
      await queryInterface.changeColumn('purchased_packages', 'budget_micro', {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Total budget in micro units'
      });
      
      // Revert purchased_budget field
      await queryInterface.changeColumn('purchased_packages', 'purchased_budget', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total budget in KWD'
      });
      
      console.log('✅ Successfully reverted purchased_packages numeric fields');
      
      // Remove performance indexes
      console.log('📈 Removing performance indexes...');
      
      await queryInterface.removeIndex('purchased_packages', 'idx_purchased_packages_remaining_micro');
      await queryInterface.removeIndex('purchased_packages', 'idx_purchased_packages_used_micro');
      await queryInterface.removeIndex('purchased_packages', 'idx_purchased_packages_status_remaining');
      
      console.log('✅ Successfully removed performance indexes');
      
      console.log('🔄 Rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
