// backend/src/migrations/20250125-fix-purchased-packages-schema.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Starting purchased_packages schema fix migration...');
    
    try {
      // 1. Add missing advertiser_id column
      console.log('📊 Adding advertiser_id column to purchased_packages...');
      await queryInterface.addColumn('purchased_packages', 'advertiser_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Advertiser ID (same as user_id for purchased packages)'
      });

      // 2. Populate advertiser_id from user_id
      console.log('🔄 Populating advertiser_id from user_id...');
      await queryInterface.sequelize.query(`
        UPDATE purchased_packages 
        SET advertiser_id = user_id 
        WHERE advertiser_id IS NULL
      `);

      // 3. Make advertiser_id NOT NULL after population
      console.log('🔒 Making advertiser_id NOT NULL...');
      await queryInterface.changeColumn('purchased_packages', 'advertiser_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Advertiser ID (same as user_id for purchased packages)'
      });

      // 4. Add foreign key constraint
      console.log('🔗 Adding foreign key constraint...');
      await queryInterface.addConstraint('purchased_packages', {
        fields: ['advertiser_id'],
        type: 'foreign key',
        name: 'fk_purchased_packages_advertiser_id',
        references: {
          table: 'users',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      // 5. Add indexes for performance
      console.log('📈 Adding performance indexes...');
      await queryInterface.addIndex('purchased_packages', ['advertiser_id'], {
        name: 'idx_purchased_packages_advertiser_id'
      });

      await queryInterface.addIndex('purchased_packages', ['status', 'remaining_budget_micro'], {
        name: 'idx_purchased_packages_status_remaining'
      });

      // 6. Verify schema consistency
      console.log('✅ Verifying schema consistency...');
      const [results] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'purchased_packages' 
        AND column_name IN ('advertiser_id', 'remaining_budget_micro', 'total_budget_micro')
        ORDER BY column_name
      `);

      console.log('📋 Schema verification results:', results);

      // 7. Test the problematic query
      console.log('🧪 Testing the previously failing query...');
      const [testResults] = await queryInterface.sequelize.query(`
        SELECT 
          pp.id, 
          pp.user_id, 
          pp.advertiser_id,
          pp.package_id, 
          pp.total_budget_micro, 
          pp.remaining_budget_micro, 
          pp.estimated_views, 
          pp.actual_views, 
          pp.status, 
          pp.purchased_at, 
          pp.expires_at,
          ap.name as package_name,
          ap.duration as package_duration,
          ap.price_per_view_micro
        FROM purchased_packages pp
        LEFT OUTER JOIN advertiser_packages ap ON pp.package_id = ap.id
        WHERE pp.advertiser_id IS NOT NULL
        AND pp.status = 'active' 
        AND pp.remaining_budget_micro > 0
        ORDER BY pp.purchased_at ASC
        LIMIT 5
      `);

      console.log('✅ Test query executed successfully. Sample results:', testResults.length);

      console.log('🎯 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back purchased_packages schema fix...');
    
    try {
      // Remove indexes
      console.log('📈 Removing indexes...');
      await queryInterface.removeIndex('purchased_packages', 'idx_purchased_packages_status_remaining');
      await queryInterface.removeIndex('purchased_packages', 'idx_purchased_packages_advertiser_id');

      // Remove foreign key constraint
      console.log('🔗 Removing foreign key constraint...');
      await queryInterface.removeConstraint('purchased_packages', 'fk_purchased_packages_advertiser_id');

      // Remove advertiser_id column
      console.log('📊 Removing advertiser_id column...');
      await queryInterface.removeColumn('purchased_packages', 'advertiser_id');

      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
