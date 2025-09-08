// backend/src/migrations/20250101-create-complete-schema.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table first (referenced by other tables)
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('viewer', 'advertiser', 'admin'),
        allowNull: false,
        defaultValue: 'viewer'
      },
      kyc_status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      signatory_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      license_doc_key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Create videos table (referenced by view_events)
    await queryInterface.createTable('videos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sections: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      spent: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      advertiser_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Create view_events table (references videos and users)
    await queryInterface.createTable('view_events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      video_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'videos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create wallets table
    await queryInterface.createTable('wallets', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
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
      balance: {
        type: Sequelize.DECIMAL(20, 3),
        allowNull: false,
        defaultValue: 0
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

    // Create sections table
    await queryInterface.createTable('sections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#1976d2'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      ad_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    // Create advertiser_packages table
    await queryInterface.createTable('advertiser_packages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price_per_view: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      viewer_reward: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0.005
      },
      company_fee: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      min_budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 300.00
      },
      budget_increment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100.00
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Update users table
    await queryInterface.addColumn('users', 'verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'verified_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Update ads table
    await queryInterface.addColumn('ads', 'remaining_budget', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 300.00
    });

    await queryInterface.addColumn('ads', 'section', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn('ads', 'status', {
      type: Sequelize.ENUM('draft', 'active', 'paused', 'completed', 'expired'),
      allowNull: false,
      defaultValue: 'draft'
    });

    await queryInterface.addColumn('ads', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Update view_events table
    await queryInterface.removeColumn('view_events', 'video_id');
    await queryInterface.addColumn('view_events', 'ad_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ads',
        key: 'id'
      }
    });

    await queryInterface.addColumn('view_events', 'package_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'advertiser_packages',
        key: 'id'
      }
    });

    await queryInterface.addColumn('view_events', 'viewer_reward', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.005
    });

    await queryInterface.addColumn('view_events', 'company_fee', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false
    });

    await queryInterface.addColumn('view_events', 'total_cost', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false
    });

    await queryInterface.addColumn('view_events', 'is_completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('view_events', 'completion_duration', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('view_events', 'required_duration', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.addColumn('view_events', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Update wallets table
    await queryInterface.changeColumn('wallets', 'balance', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    // Remove old columns from wallets
    await queryInterface.removeColumn('wallets', 'confirmed_points');
    await queryInterface.removeColumn('wallets', 'pending_points');

    // Update transactions table
    await queryInterface.addColumn('transactions', 'reference_id', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'reference_type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add indexes for performance
    await queryInterface.addIndex('users', ['phone']);
    await queryInterface.addIndex('users', ['civil_id']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['kyc_status']);

    await queryInterface.addIndex('ads', ['advertiser_id']);
    await queryInterface.addIndex('ads', ['section']);
    await queryInterface.addIndex('ads', ['status']);
    await queryInterface.addIndex('ads', ['is_active']);

    await queryInterface.addIndex('view_events', ['ad_id']);
    await queryInterface.addIndex('view_events', ['user_id']);
    await queryInterface.addIndex('view_events', ['is_completed']);

    await queryInterface.addIndex('sections', ['key']);
    await queryInterface.addIndex('sections', ['is_active']);

    await queryInterface.addIndex('advertiser_packages', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('users', ['phone']);
    await queryInterface.removeIndex('users', ['civil_id']);
    await queryInterface.removeIndex('users', ['role']);
    await queryInterface.removeIndex('users', ['kyc_status']);

    await queryInterface.removeIndex('ads', ['advertiser_id']);
    await queryInterface.removeIndex('ads', ['section']);
    await queryInterface.removeIndex('ads', ['status']);
    await queryInterface.removeIndex('ads', ['is_active']);

    await queryInterface.removeIndex('view_events', ['ad_id']);
    await queryInterface.removeIndex('view_events', ['user_id']);
    await queryInterface.removeIndex('view_events', ['is_completed']);

    await queryInterface.removeIndex('sections', ['key']);
    await queryInterface.removeIndex('sections', ['is_active']);

    await queryInterface.removeIndex('advertiser_packages', ['is_active']);

    // Remove columns
    await queryInterface.removeColumn('users', 'verified_at');
    await queryInterface.removeColumn('users', 'verified_by');
    await queryInterface.removeColumn('users', 'is_active');

    await queryInterface.removeColumn('ads', 'remaining_budget');
    await queryInterface.removeColumn('ads', 'section');
    await queryInterface.removeColumn('ads', 'status');
    await queryInterface.removeColumn('ads', 'is_active');

    await queryInterface.removeColumn('view_events', 'ad_id');
    await queryInterface.removeColumn('view_events', 'package_id');
    await queryInterface.removeColumn('view_events', 'viewer_reward');
    await queryInterface.removeColumn('view_events', 'company_fee');
    await queryInterface.removeColumn('view_events', 'total_cost');
    await queryInterface.removeColumn('view_events', 'is_completed');
    await queryInterface.removeColumn('view_events', 'completion_duration');
    await queryInterface.removeColumn('view_events', 'required_duration');
    await queryInterface.removeColumn('view_events', 'completed_at');

    await queryInterface.removeColumn('transactions', 'reference_id');
    await queryInterface.removeColumn('transactions', 'reference_type');
    await queryInterface.removeColumn('transactions', 'description');

    // Drop tables in reverse order
    await queryInterface.dropTable('view_events');
    await queryInterface.dropTable('videos');
    await queryInterface.dropTable('wallets');
    await queryInterface.dropTable('sections');
    await queryInterface.dropTable('advertiser_packages');
    await queryInterface.dropTable('users');
  }
}; 