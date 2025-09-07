// backend/migrations/20250814_fix_transaction_amounts.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Starting transaction amount field migration...');

      // First, convert existing KWD amounts to fils
      console.log('📊 Converting existing KWD amounts to fils...');
      await queryInterface.sequelize.query(`
        UPDATE transactions 
        SET amount = ROUND(amount * 1000)
        WHERE amount < 1 AND amount > 0
      `);

      // Now change the column type to BIGINT
      console.log('🔧 Changing amount column type to BIGINT...');
      await queryInterface.changeColumn('transactions', 'amount', {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Amount in fils (smallest currency unit)'
      });

      console.log('✅ Transaction amount field migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Rolling back transaction amount field migration...');

      // Convert fils back to KWD
      console.log('📊 Converting fils amounts back to KWD...');
      await queryInterface.sequelize.query(`
        UPDATE transactions 
        SET amount = ROUND(amount / 1000.0, 3)
        WHERE amount >= 1000
      `);

      // Change column type back to DECIMAL
      console.log('🔧 Changing amount column type back to DECIMAL...');
      await queryInterface.changeColumn('transactions', 'amount', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Amount in KWD'
      });

      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
