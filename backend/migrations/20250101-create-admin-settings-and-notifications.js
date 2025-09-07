// backend/migrations/20250101-create-admin-settings-and-notifications.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin_settings table
    await queryInterface.createTable('admin_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Setting key identifier'
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Setting value (JSON string for complex objects)'
      },
      category: {
        type: Sequelize.ENUM('notification', 'system', 'security', 'business'),
        allowNull: false,
        defaultValue: 'system',
        comment: 'Setting category for organization'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description of the setting'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the setting is active'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        comment: 'Admin who last updated this setting'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for admin_settings
    await queryInterface.addIndex('admin_settings', ['key'], { unique: true });
    await queryInterface.addIndex('admin_settings', ['category']);
    await queryInterface.addIndex('admin_settings', ['is_active']);

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
        references: { model: 'users', key: 'id' },
        comment: 'Admin user who should receive the notification'
      },
      type: {
        type: Sequelize.ENUM('verification', 'withdrawal', 'appeal', 'kyc', 'system', 'alert'),
        allowNull: false,
        comment: 'Type of notification'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Notification title'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Notification message content'
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional data related to the notification'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Notification priority level'
      },
      status: {
        type: Sequelize.ENUM('unread', 'read', 'archived'),
        allowNull: false,
        defaultValue: 'unread',
        comment: 'Notification status'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the notification was read'
      },
      action_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to navigate to when notification is clicked'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the notification expires'
      },
      is_email_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether email notification was sent'
      },
      is_push_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether push notification was sent'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for notifications
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notifications', ['priority']);
    await queryInterface.addIndex('notifications', ['created_at']);
    await queryInterface.addIndex('notifications', ['expires_at']);

    // Update company_wallets table to match new structure
    await queryInterface.addColumn('company_wallets', 'name', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Main Company Wallet',
      comment: 'Wallet name for identification'
    });

    await queryInterface.addColumn('company_wallets', 'held_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Held balance for pending transactions in micro units'
    });

    await queryInterface.addColumn('company_wallets', 'total_earnings_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total earnings since wallet creation in micro units'
    });

    await queryInterface.addColumn('company_wallets', 'total_company_fees_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total company fees collected in micro units'
    });

    await queryInterface.addColumn('company_wallets', 'total_viewer_rewards_paid_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total viewer rewards paid out in micro units'
    });

    await queryInterface.addColumn('company_wallets', 'total_ad_spending_micro', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total ad spending tracked in micro units'
    });

    await queryInterface.addColumn('company_wallets', 'wallet_type', {
      type: Sequelize.ENUM('main', 'reserve', 'operational'),
      allowNull: false,
      defaultValue: 'main',
      comment: 'Type of company wallet'
    });

    await queryInterface.addColumn('company_wallets', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Additional description of the wallet'
    });

    // Add indexes for company_wallets
    await queryInterface.addIndex('company_wallets', ['is_active']);
    await queryInterface.addIndex('company_wallets', ['wallet_type']);
    await queryInterface.addIndex('company_wallets', ['balance_micro']);

    // Insert default admin settings
    const defaultSettings = [
      {
        key: 'emailNotifications',
        value: 'true',
        category: 'notification',
        description: 'Enable email notifications for admins',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'pushNotifications',
        value: 'true',
        category: 'notification',
        description: 'Enable push notifications for admins',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'verificationAlerts',
        value: 'true',
        category: 'notification',
        description: 'Alert admins about pending verifications',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'withdrawalAlerts',
        value: 'true',
        category: 'notification',
        description: 'Alert admins about withdrawal requests',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'appealAlerts',
        value: 'true',
        category: 'notification',
        description: 'Alert admins about pending appeals',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'autoApproveThreshold',
        value: '100',
        category: 'system',
        description: 'Minimum threshold for auto-approval features',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'maxVideoDuration',
        value: '30',
        category: 'system',
        description: 'Maximum allowed video duration in seconds',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'maxFileSize',
        value: '50',
        category: 'system',
        description: 'Maximum allowed file size in MB',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'maintenanceMode',
        value: 'false',
        category: 'system',
        description: 'Enable maintenance mode for the platform',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'requireTwoFactor',
        value: 'false',
        category: 'security',
        description: 'Require two-factor authentication for admins',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'sessionTimeout',
        value: '30',
        category: 'security',
        description: 'Admin session timeout in minutes',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'maxLoginAttempts',
        value: '5',
        category: 'security',
        description: 'Maximum login attempts before lockout',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'passwordExpiry',
        value: '90',
        category: 'security',
        description: 'Password expiry in days',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'companyFeePercentage',
        value: '50',
        category: 'business',
        description: 'Company fee percentage from ad views',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'minimumWithdrawal',
        value: '10',
        category: 'business',
        description: 'Minimum withdrawal amount in KWD',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'maximumWithdrawal',
        value: '10000',
        category: 'business',
        description: 'Maximum withdrawal amount in KWD',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'autoPayoutEnabled',
        value: 'false',
        category: 'business',
        description: 'Enable automatic payouts for approved withdrawals',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('admin_settings', defaultSettings);

    // Create or update main company wallet
    const existingWallet = await queryInterface.sequelize.query(
      'SELECT id FROM company_wallets WHERE wallet_type = "main" LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingWallet.length === 0) {
      await queryInterface.bulkInsert('company_wallets', [{
        id: Sequelize.UUIDV4,
        name: 'Main Company Wallet',
        balance_micro: 0,
        held_micro: 0,
        total_earnings_micro: 0,
        total_video_views: 0,
        total_company_fees_micro: 0,
        total_viewer_rewards_paid_micro: 0,
        total_ad_spending_micro: 0,
        is_active: true,
        wallet_type: 'main',
        description: 'Primary company wallet for all operations',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop notifications table
    await queryInterface.dropTable('notifications');
    
    // Drop admin_settings table
    await queryInterface.dropTable('admin_settings');
    
    // Remove added columns from company_wallets
    await queryInterface.removeColumn('company_wallets', 'name');
    await queryInterface.removeColumn('company_wallets', 'held_micro');
    await queryInterface.removeColumn('company_wallets', 'total_earnings_micro');
    await queryInterface.removeColumn('company_wallets', 'total_company_fees_micro');
    await queryInterface.removeColumn('company_wallets', 'total_viewer_rewards_paid_micro');
    await queryInterface.removeColumn('company_wallets', 'total_ad_spending_micro');
    await queryInterface.removeColumn('company_wallets', 'wallet_type');
    await queryInterface.removeColumn('company_wallets', 'description');
    
    // Remove indexes
    await queryInterface.removeIndex('company_wallets', ['is_active']);
    await queryInterface.removeIndex('company_wallets', ['wallet_type']);
    await queryInterface.removeIndex('company_wallets', ['balance_micro']);
  }
};
