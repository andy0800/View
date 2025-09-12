// backend/src/migrations/20250109-fix-complete-schema.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Starting comprehensive schema fix...');

    // 1. First, add missing columns to existing tables
    console.log('📝 Adding missing columns to existing tables...');

    // Add missing columns to users table
    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Account status - whether user is active'
    });

    await queryInterface.addColumn('users', 'verified_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Create missing core tables
    console.log('📝 Creating missing core tables...');

    // Create ads table (replaces videos functionality)
    await queryInterface.createTable('ads', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
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
      package_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'advertiser_packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      purchased_package_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'purchased_packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      image_key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      section: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'completed', 'expired'),
        allowNull: false,
        defaultValue: 'draft'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      image_key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cta_link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cta_text: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Learn More'
      },
      cta_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      verification_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'under_appeal'),
        allowNull: false,
        defaultValue: 'pending'
      },
      verified_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submitted_for_review_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      review_deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      appeal_deadline: {
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

    // Create purchased_packages table
    await queryInterface.createTable('purchased_packages', {
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
      package_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'advertiser_packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      total_budget_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Total budget in micro units (1,000,000 = 1 KWD)'
      },
      remaining_budget_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Remaining budget in micro units'
      },
      estimated_views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Estimated number of views based on budget'
      },
      views_completed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Actual number of views generated'
      },
      status: {
        type: Sequelize.ENUM('active', 'used', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      purchased_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Package expiration date'
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

    // Create transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      from_wallet_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      to_wallet_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      company_wallet_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'company_wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM(
          'purchase',
          'view_charge',
          'viewer_reward',
          'company_fee',
          'withdraw',
          'deposit',
          'refund',
          'transfer'
        ),
        allowNull: false
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Transaction amount in micro units (1,000,000 = 1 KWD)'
      },
      amount_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Transaction amount in micro units'
      },
      reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Human-readable reference for the transaction'
      },
      transaction_category: {
        type: Sequelize.ENUM(
          'package_purchase',
          'ad_view',
          'viewer_reward',
          'company_fee',
          'withdrawal',
          'deposit',
          'refund',
          'transfer'
        ),
        allowNull: false,
        defaultValue: 'ad_view'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'completed'
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional transaction metadata'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When transaction was processed'
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

    // Create company_wallets table
    await queryInterface.createTable('company_wallets', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Main Company Wallet'
      },
      company_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      balance_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Current balance in micro units'
      },
      balance: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Legacy balance field for compatibility'
      },
      held_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Held balance for pending transactions'
      },
      total_earnings_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total earnings in micro units'
      },
      total_earnings: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Legacy total earnings field'
      },
      total_video_views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_company_fees_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      total_viewer_rewards_paid_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      total_ad_spending_micro: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      wallet_type: {
        type: Sequelize.ENUM('main', 'reserve', 'operational'),
        allowNull: false,
        defaultValue: 'main'
      },
      description: {
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

    // Create sessions table
    await queryInterface.createTable('sessions', {
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
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      last_activity: {
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

    // Create otp_codes table
    await queryInterface.createTable('otp_codes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create withdrawals table
    await queryInterface.createTable('withdrawals', {
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      approved: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
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

    // Create notifications table
    await queryInterface.createTable('notifications', {
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
      type: {
        type: Sequelize.ENUM('verification', 'withdrawal', 'appeal', 'kyc', 'system', 'alert'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('unread', 'read', 'archived'),
        allowNull: false,
        defaultValue: 'unread'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      action_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_email_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_push_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Create comments table
    await queryInterface.createTable('comments', {
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
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      likes_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      replies_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deleted_at: {
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

    // Create comment_likes table
    await queryInterface.createTable('comment_likes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      comment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      appeal_deadline: {
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
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
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

    // 3. Update existing tables with micro-unit fields
    console.log('📝 Adding micro-unit fields to existing tables...');

    // Add micro-unit fields to advertiser_packages
    await queryInterface.addColumn('advertiser_packages', 'price_per_view_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 10000, // 0.010 KWD in micro units
      comment: 'Price per view in micro units (1,000,000 = 1 KWD)'
    });

    await queryInterface.addColumn('advertiser_packages', 'min_budget_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 300000000, // 300 KWD in micro units
      comment: 'Minimum budget in micro units (300 KWD)'
    });

    await queryInterface.addColumn('advertiser_packages', 'budget_increment_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 100000000, // 100 KWD in micro units
      comment: 'Budget increment in micro units (100 KWD)'
    });

    // Add micro-unit fields to wallets
    await queryInterface.addColumn('wallets', 'balance_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Balance in micro units (1,000,000 = 1 KWD)'
    });

    await queryInterface.addColumn('wallets', 'held_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Held balance in micro units'
    });

    // Update view_events table to reference ads instead of videos
    console.log('📝 Updating view_events table...');

    // First, add new columns
    await queryInterface.addColumn('view_events', 'ad_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'ads',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('view_events', 'package_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'advertiser_packages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    await queryInterface.addColumn('view_events', 'purchased_package_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'purchased_packages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('view_events', 'viewer_reward_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 5000,
      comment: 'Viewer reward in micro units'
    });

    await queryInterface.addColumn('view_events', 'company_fee_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 5000,
      comment: 'Company fee in micro units'
    });

    await queryInterface.addColumn('view_events', 'total_cost_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 10000,
      comment: 'Total cost in micro units'
    });

    await queryInterface.addColumn('view_events', 'is_completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('view_events', 'completion_duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Actual completion duration in seconds'
    });

    await queryInterface.addColumn('view_events', 'required_duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Required duration in seconds'
    });

    await queryInterface.addColumn('view_events', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add missing fields from view_event model
    await queryInterface.addColumn('view_events', 'proof_token', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'HMAC proof token for view validation'
    });

    await queryInterface.addColumn('view_events', 'proof_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: false,
      comment: 'When proof token expires'
    });

    await queryInterface.addColumn('view_events', 'charged_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Amount charged in micro units'
    });

    await queryInterface.addColumn('view_events', 'watched_duration_ms', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Actual milliseconds watched'
    });

    await queryInterface.addColumn('view_events', 'required_duration_ms', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Required milliseconds from package'
    });

    // 4. Create indexes for performance
    console.log('📝 Creating indexes...');

    // Ads table indexes
    await queryInterface.addIndex('ads', ['advertiser_id']);
    await queryInterface.addIndex('ads', ['package_id']);
    await queryInterface.addIndex('ads', ['purchased_package_id']);
    await queryInterface.addIndex('ads', ['section']);
    await queryInterface.addIndex('ads', ['status']);
    await queryInterface.addIndex('ads', ['verification_status']);
    await queryInterface.addIndex('ads', ['is_active']);

    // Purchased packages indexes
    await queryInterface.addIndex('purchased_packages', ['user_id']);
    await queryInterface.addIndex('purchased_packages', ['package_id']);
    await queryInterface.addIndex('purchased_packages', ['status']);

    // Transactions indexes
    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['from_wallet_id']);
    await queryInterface.addIndex('transactions', ['to_wallet_id']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['transaction_category']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['created_at']);

    // Company wallets indexes
    await queryInterface.addIndex('company_wallets', ['is_active']);
    await queryInterface.addIndex('company_wallets', ['wallet_type']);

    // Sessions indexes
    await queryInterface.addIndex('sessions', ['user_id']);
    await queryInterface.addIndex('sessions', ['token']);
    await queryInterface.addIndex('sessions', ['expires_at']);

    // OTP codes indexes
    await queryInterface.addIndex('otp_codes', ['phone']);
    await queryInterface.addIndex('otp_codes', ['expires_at']);

    // Withdrawals indexes
    await queryInterface.addIndex('withdrawals', ['user_id']);
    await queryInterface.addIndex('withdrawals', ['approved']);

    // Notifications indexes
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notifications', ['priority']);

    // Comments indexes
    await queryInterface.addIndex('comments', ['ad_id']);
    await queryInterface.addIndex('comments', ['user_id']);
    await queryInterface.addIndex('comments', ['parent_id']);
    await queryInterface.addIndex('comments', ['is_deleted']);

    // Comment likes indexes
    await queryInterface.addIndex('comment_likes', ['comment_id', 'user_id'], {
      unique: true
    });

    // Ad appeals indexes
    await queryInterface.addIndex('ad_appeals', ['ad_id']);
    await queryInterface.addIndex('ad_appeals', ['advertiser_id']);
    await queryInterface.addIndex('ad_appeals', ['status']);

    // Ad verification history indexes
    await queryInterface.addIndex('ad_verification_history', ['ad_id']);
    await queryInterface.addIndex('ad_verification_history', ['action']);
    await queryInterface.addIndex('ad_verification_history', ['admin_id']);

    // View events indexes
    await queryInterface.addIndex('view_events', ['ad_id']);
    await queryInterface.addIndex('view_events', ['is_completed']);
    await queryInterface.addIndex('view_events', ['proof_token']);
    await queryInterface.addIndex('view_events', ['proof_token_expires_at']);
    await queryInterface.addIndex('view_events', ['user_id']);
    await queryInterface.addIndex('view_events', ['purchased_package_id']);
    await queryInterface.addIndex('view_events', ['viewed_at']);

    console.log('✅ Comprehensive schema fix completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back comprehensive schema fix...');

    // Remove indexes
    await queryInterface.removeIndex('ad_verification_history', ['admin_id']);
    await queryInterface.removeIndex('ad_verification_history', ['action']);
    await queryInterface.removeIndex('ad_verification_history', ['ad_id']);

    await queryInterface.removeIndex('ad_appeals', ['status']);
    await queryInterface.removeIndex('ad_appeals', ['advertiser_id']);
    await queryInterface.removeIndex('ad_appeals', ['ad_id']);

    await queryInterface.removeIndex('comment_likes', ['comment_id', 'user_id']);

    await queryInterface.removeIndex('comments', ['is_deleted']);
    await queryInterface.removeIndex('comments', ['parent_id']);
    await queryInterface.removeIndex('comments', ['user_id']);
    await queryInterface.removeIndex('comments', ['ad_id']);

    await queryInterface.removeIndex('notifications', ['priority']);
    await queryInterface.removeIndex('notifications', ['status']);
    await queryInterface.removeIndex('notifications', ['type']);
    await queryInterface.removeIndex('notifications', ['user_id']);

    await queryInterface.removeIndex('withdrawals', ['approved']);
    await queryInterface.removeIndex('withdrawals', ['user_id']);

    await queryInterface.removeIndex('otp_codes', ['expires_at']);
    await queryInterface.removeIndex('otp_codes', ['phone']);

    await queryInterface.removeIndex('sessions', ['expires_at']);
    await queryInterface.removeIndex('sessions', ['token']);
    await queryInterface.removeIndex('sessions', ['user_id']);

    await queryInterface.removeIndex('company_wallets', ['wallet_type']);
    await queryInterface.removeIndex('company_wallets', ['is_active']);

    await queryInterface.removeIndex('transactions', ['created_at']);
    await queryInterface.removeIndex('transactions', ['status']);
    await queryInterface.removeIndex('transactions', ['transaction_category']);
    await queryInterface.removeIndex('transactions', ['type']);
    await queryInterface.removeIndex('transactions', ['to_wallet_id']);
    await queryInterface.removeIndex('transactions', ['from_wallet_id']);
    await queryInterface.removeIndex('transactions', ['user_id']);

    await queryInterface.removeIndex('purchased_packages', ['status']);
    await queryInterface.removeIndex('purchased_packages', ['package_id']);
    await queryInterface.removeIndex('purchased_packages', ['user_id']);

    await queryInterface.removeIndex('ads', ['is_active']);
    await queryInterface.removeIndex('ads', ['verification_status']);
    await queryInterface.removeIndex('ads', ['status']);
    await queryInterface.removeIndex('ads', ['section']);
    await queryInterface.removeIndex('ads', ['purchased_package_id']);
    await queryInterface.removeIndex('ads', ['package_id']);
    await queryInterface.removeIndex('ads', ['advertiser_id']);

    await queryInterface.removeIndex('view_events', ['viewed_at']);
    await queryInterface.removeIndex('view_events', ['purchased_package_id']);
    await queryInterface.removeIndex('view_events', ['user_id']);
    await queryInterface.removeIndex('view_events', ['proof_token_expires_at']);
    await queryInterface.removeIndex('view_events', ['proof_token']);
    await queryInterface.removeIndex('view_events', ['is_completed']);
    await queryInterface.removeIndex('view_events', ['ad_id']);

    // Remove columns from view_events
    await queryInterface.removeColumn('view_events', 'required_duration_ms');
    await queryInterface.removeColumn('view_events', 'watched_duration_ms');
    await queryInterface.removeColumn('view_events', 'charged_micro');
    await queryInterface.removeColumn('view_events', 'proof_token_expires_at');
    await queryInterface.removeColumn('view_events', 'proof_token');
    await queryInterface.removeColumn('view_events', 'completed_at');
    await queryInterface.removeColumn('view_events', 'required_duration');
    await queryInterface.removeColumn('view_events', 'completion_duration');
    await queryInterface.removeColumn('view_events', 'is_completed');
    await queryInterface.removeColumn('view_events', 'total_cost_micro');
    await queryInterface.removeColumn('view_events', 'company_fee_micro');
    await queryInterface.removeColumn('view_events', 'viewer_reward_micro');
    await queryInterface.removeColumn('view_events', 'purchased_package_id');
    await queryInterface.removeColumn('view_events', 'package_id');
    await queryInterface.removeColumn('view_events', 'ad_id');

    // Remove columns from wallets
    await queryInterface.removeColumn('wallets', 'held_micro');
    await queryInterface.removeColumn('wallets', 'balance_micro');

    // Remove columns from advertiser_packages
    await queryInterface.removeColumn('advertiser_packages', 'budget_increment_micro');
    await queryInterface.removeColumn('advertiser_packages', 'min_budget_micro');
    await queryInterface.removeColumn('advertiser_packages', 'price_per_view_micro');

    // Remove columns from users
    await queryInterface.removeColumn('users', 'verified_by');
    await queryInterface.removeColumn('users', 'is_active');

    // Drop tables in reverse order
    await queryInterface.dropTable('ad_verification_history');
    await queryInterface.dropTable('ad_appeals');
    await queryInterface.dropTable('comment_likes');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('withdrawals');
    await queryInterface.dropTable('otp_codes');
    await queryInterface.dropTable('sessions');
    await queryInterface.dropTable('company_wallets');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('purchased_packages');
    await queryInterface.dropTable('ads');

    console.log('✅ Rollback completed');
  }
};
