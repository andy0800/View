// backend/src/models/notification.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      comment: 'Admin user who should receive the notification'
    },
    type: {
      type: DataTypes.ENUM('verification', 'withdrawal', 'appeal', 'kyc', 'system', 'alert'),
      allowNull: false,
      comment: 'Type of notification'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Notification title'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Notification message content'
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data related to the notification'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Notification priority level'
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'archived'),
      allowNull: false,
      defaultValue: 'unread',
      comment: 'Notification status'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the notification was read'
    },
    action_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL to navigate to when notification is clicked'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the notification expires'
    },
    is_email_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether email notification was sent'
    },
    is_push_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether push notification was sent'
    }
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  // Instance methods
  Notification.prototype.markAsRead = async function() {
    this.status = 'read';
    this.read_at = new Date();
    await this.save();
  };

  Notification.prototype.markAsArchived = async function() {
    this.status = 'archived';
    await this.save();
  };

  Notification.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  };

  Notification.prototype.isUrgent = function() {
    return this.priority === 'urgent' || this.priority === 'high';
  };

  // Class methods for notification management
  Notification.createVerificationAlert = function(userId, adId, adTitle, advertiserName) {
    return this.create({
      user_id: userId,
      type: 'verification',
      title: 'New Ad Pending Review',
      message: `Ad "${adTitle}" from ${advertiserName} is pending review`,
      data: { ad_id: adId, ad_title: adTitle, advertiser_name: advertiserName },
      priority: 'high',
      action_url: `/admin/verify?ad=${adId}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  };

  Notification.createWithdrawalAlert = function(userId, withdrawalId, amount, userName) {
    return this.create({
      user_id: userId,
      type: 'withdrawal',
      title: 'New Withdrawal Request',
      message: `${userName} requested withdrawal of ${amount} KWD`,
      data: { withdrawal_id: withdrawalId, amount, user_name: userName },
      priority: 'medium',
      action_url: `/admin/withdrawals?withdrawal=${withdrawalId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  };

  Notification.createAppealAlert = function(userId, appealId, adTitle, advertiserName) {
    return this.create({
      user_id: userId,
      type: 'appeal',
      title: 'New Appeal Submitted',
      message: `Appeal submitted for ad "${adTitle}" from ${advertiserName}`,
      data: { appeal_id: appealId, ad_title: adTitle, advertiser_name: advertiserName },
      priority: 'high',
      action_url: `/admin/appeals?appeal=${appealId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  };

  Notification.createKycAlert = function(userId, kycUserId, userName, userRole) {
    return this.create({
      user_id: userId,
      type: 'kyc',
      title: 'New KYC Verification Request',
      message: `${userName} (${userRole}) submitted KYC verification`,
      data: { kyc_user_id: kycUserId, user_name: userName, user_role: userRole },
      priority: 'medium',
      action_url: `/admin/kyc?user=${kycUserId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  };

  Notification.createSystemAlert = function(userId, title, message, priority = 'medium', data = null) {
    return this.create({
      user_id: userId,
      type: 'system',
      title,
      message,
      data,
      priority,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  };

  Notification.getUnreadForUser = function(userId, limit = 50) {
    return this.findAll({
      where: {
        user_id: userId,
        status: 'unread'
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      // Add performance optimizations
      attributes: ['id', 'type', 'title', 'message', 'priority', 'created_at', 'data', 'action_url'],
      // Add caching hint
      cache: true
    });
  };

  Notification.getUnreadCountForUser = function(userId) {
    return this.count({
      where: {
        user_id: userId,
        status: 'unread'
      }
    });
  };

  Notification.getUnreadCountByType = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        status: 'unread'
      },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      // Add caching hint for aggregated data
      cache: true
    });
  };

  Notification.markAllAsRead = function(userId) {
    return this.update(
      {
        status: 'read',
        read_at: new Date()
      },
      {
        where: {
          user_id: userId,
          status: 'unread'
        }
      }
    );
  };

  Notification.cleanupExpired = function() {
    return this.update(
      {
        status: 'archived'
      },
      {
        where: {
          expires_at: {
            [sequelize.Op.lt]: new Date()
          },
          status: {
            [sequelize.Op.ne]: 'archived'
          }
        }
      }
    );
  };

  Notification.associate = models => {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Notification;
};
