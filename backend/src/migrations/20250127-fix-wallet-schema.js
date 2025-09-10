// backend/src/migrations/20250127-fix-wallet-schema.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Fixing wallet schema - adding missing micro-unit columns...');

    try {
      // Check if balance_micro column exists
      const tableDescription = await queryInterface.describeTable('wallets');
      
      if (!tableDescription.balance_micro) {
        console.log('📝 Adding balance_micro column to wallets table...');
        await queryInterface.addColumn('wallets', 'balance_micro', {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
          comment: 'Balance in micro units (1,000,000 = 1 KWD)'
        });
        console.log('✅ Added balance_micro column');
      } else {
        console.log('✅ balance_micro column already exists');
      }

      if (!tableDescription.held_micro) {
        console.log('📝 Adding held_micro column to wallets table...');
        await queryInterface.addColumn('wallets', 'held_micro', {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
          comment: 'Held balance in micro units (for pending transactions)'
        });
        console.log('✅ Added held_micro column');
      } else {
        console.log('✅ held_micro column already exists');
      }

      // Add confirmed_points and pending_points if they don't exist
      if (!tableDescription.confirmed_points) {
        console.log('📝 Adding confirmed_points column to wallets table...');
        await queryInterface.addColumn('wallets', 'confirmed_points', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Legacy field - maintained for backward compatibility'
        });
        console.log('✅ Added confirmed_points column');
      } else {
        console.log('✅ confirmed_points column already exists');
      }

      if (!tableDescription.pending_points) {
        console.log('📝 Adding pending_points column to wallets table...');
        await queryInterface.addColumn('wallets', 'pending_points', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Legacy field - maintained for backward compatibility'
        });
        console.log('✅ Added pending_points column');
      } else {
        console.log('✅ pending_points column already exists');
      }

      // Migrate existing balance data to balance_micro if balance_micro is 0
      console.log('📝 Migrating existing balance data to micro units...');
      await queryInterface.sequelize.query(`
        UPDATE wallets 
        SET balance_micro = COALESCE(balance_micro, CAST(COALESCE(balance, 0) * 1000000 AS BIGINT))
        WHERE balance_micro = 0 OR balance_micro IS NULL;
      `);
      console.log('✅ Migrated existing balance data');

      // Add indexes for performance
      console.log('📝 Adding indexes for wallet performance...');
      
      try {
        await queryInterface.addIndex('wallets', ['balance_micro'], {
          name: 'idx_wallets_balance_micro'
        });
        console.log('✅ Added balance_micro index');
      } catch (err) {
        console.log('⚠️ balance_micro index already exists or error:', err.message);
      }

      try {
        await queryInterface.addIndex('wallets', ['held_micro'], {
          name: 'idx_wallets_held_micro'
        });
        console.log('✅ Added held_micro index');
      } catch (err) {
        console.log('⚠️ held_micro index already exists or error:', err.message);
      }

      console.log('🎉 Wallet schema fix completed successfully!');
      console.log('📋 Wallet table now has:');
      console.log('   • balance_micro: Current balance in micro units');
      console.log('   • held_micro: Held balance in micro units');
      console.log('   • confirmed_points: Legacy points field');
      console.log('   • pending_points: Legacy points field');
      console.log('   • balance: Original balance field (kept for compatibility)');

    } catch (error) {
      console.error('❌ Error fixing wallet schema:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back wallet schema changes...');

    try {
      // Remove indexes first
      await queryInterface.removeIndex('wallets', ['balance_micro']);
      await queryInterface.removeIndex('wallets', ['held_micro']);

      // Remove columns
      await queryInterface.removeColumn('wallets', 'balance_micro');
      await queryInterface.removeColumn('wallets', 'held_micro');
      await queryInterface.removeColumn('wallets', 'confirmed_points');
      await queryInterface.removeColumn('wallets', 'pending_points');

      console.log('✅ Wallet schema rollback completed');
    } catch (error) {
      console.error('❌ Error rolling back wallet schema:', error);
      throw error;
    }
  }
};
