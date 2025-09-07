// backend/src/models/adminSettings.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdminSettings = sequelize.define('AdminSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Setting key identifier'
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Setting value (JSON string for complex objects)'
    },
    category: {
      type: DataTypes.ENUM('notification', 'system', 'security', 'business'),
      allowNull: false,
      defaultValue: 'system',
      comment: 'Setting category for organization'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of the setting'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the setting is active'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Admin who last updated this setting'
    }
  }, {
    tableName: 'admin_settings',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['key'],
        unique: true
      },
      {
        fields: ['category']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance methods
  AdminSettings.prototype.getValue = function() {
    try {
      return JSON.parse(this.value);
    } catch (error) {
      return this.value;
    }
  };

  AdminSettings.prototype.setValue = function(value) {
    if (typeof value === 'object') {
      this.value = JSON.stringify(value);
    } else {
      this.value = String(value);
    }
  };

  // Class methods
  AdminSettings.getSetting = function(key, defaultValue = null) {
    return this.findOne({
      where: { key, is_active: true },
      // Add performance optimizations
      attributes: ['id', 'key', 'value', 'category', 'description', 'is_active'],
      // Add caching hint
      cache: true
    }).then(setting => {
      if (!setting) return defaultValue;
      return setting.getValue();
    });
  };

  AdminSettings.setSetting = function(key, value, category = 'system', description = null, updatedBy = null) {
    return this.upsert({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      category,
      description,
      updated_by: updatedBy,
      is_active: true
    });
  };

  AdminSettings.getSettingsByCategory = function(category) {
    return this.findAll({
      where: { category, is_active: true },
      order: [['key', 'ASC']]
    });
  };

  AdminSettings.getAllSettings = function() {
    return this.findAll({
      where: { is_active: true },
      order: [['category', 'ASC'], ['key', 'ASC']],
      // Add performance optimizations
      attributes: ['id', 'key', 'value', 'category', 'description', 'is_active', 'updated_at', 'updated_by'],
      // Add caching hint
      cache: true
    });
  };

  // Initialize default settings
  AdminSettings.initializeDefaults = async function() {
    const defaults = [
      {
        key: 'emailNotifications',
        value: 'true',
        category: 'notification',
        description: 'Enable email notifications for admins'
      },
      {
        key: 'pushNotifications',
        value: 'true',
        category: 'notification',
        description: 'Enable push notifications for admins'
      },
      {
        key: 'verificationAlerts',
        value: 'true',
        category: 'notification',
        description: 'Alert admins about pending verifications'
      },
      {
        key: 'withdrawalAlerts',
        value: 'true',
        category: 'notification',
        description: 'Alert admins about withdrawal requests'
      },
      {
        key: 'appealAlerts',
        value: 'true',
        category: 'notification',
        description: 'Alert admins about pending appeals'
      },
      {
        key: 'autoApproveThreshold',
        value: '100',
        category: 'system',
        description: 'Minimum threshold for auto-approval features'
      },
      {
        key: 'maxVideoDuration',
        value: '30',
        category: 'system',
        description: 'Maximum allowed video duration in seconds'
      },
      {
        key: 'maxFileSize',
        value: '50',
        category: 'system',
        description: 'Maximum allowed file size in MB'
      },
      {
        key: 'maintenanceMode',
        value: 'false',
        category: 'system',
        description: 'Enable maintenance mode for the platform'
      },
      {
        key: 'requireTwoFactor',
        value: 'false',
        category: 'security',
        description: 'Require two-factor authentication for admins'
      },
      {
        key: 'sessionTimeout',
        value: '30',
        category: 'security',
        description: 'Admin session timeout in minutes'
      },
      {
        key: 'maxLoginAttempts',
        value: '5',
        category: 'security',
        description: 'Maximum login attempts before lockout'
      },
      {
        key: 'passwordExpiry',
        value: '90',
        category: 'security',
        description: 'Password expiry in days'
      },
      {
        key: 'companyFeePercentage',
        value: '50',
        category: 'business',
        description: 'Company fee percentage from ad views'
      },
      {
        key: 'minimumWithdrawal',
        value: '10',
        category: 'business',
        description: 'Minimum withdrawal amount in KWD'
      },
      {
        key: 'maximumWithdrawal',
        value: '10000',
        category: 'business',
        description: 'Maximum withdrawal amount in KWD'
      },
      {
        key: 'autoPayoutEnabled',
        value: 'false',
        category: 'business',
        description: 'Enable automatic payouts for approved withdrawals'
      }
    ];

    for (const defaultSetting of defaults) {
      await this.setSetting(
        defaultSetting.key,
        defaultSetting.value,
        defaultSetting.category,
        defaultSetting.description
      );
    }
  };

  AdminSettings.associate = models => {
    AdminSettings.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedBy'
    });
  };

  return AdminSettings;
};
