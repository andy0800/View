// backend/src/models/adVerificationHistory.js
// Model for tracking ad verification history and audit trail

'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdVerificationHistory = sequelize.define('AdVerificationHistory', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },

    ad_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'ads', key: 'id' },
      onDelete: 'CASCADE'
    },

    action: {
      type: DataTypes.ENUM('submitted', 'approved', 'rejected', 'appeal_submitted', 'appeal_approved', 'appeal_rejected'),
      allowNull: false
    },

    admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Maximum 1000 characters
      }
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data about the action (e.g., rejection reasons, appeal details)'
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP address of the user who performed the action'
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent of the browser/client used'
    }

  }, {
    tableName: 'ad_verification_history',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at', // Match the database schema
    indexes: [
      {
        fields: ['ad_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['admin_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  AdVerificationHistory.associate = models => {
    // Belongs to an Ad
    AdVerificationHistory.belongsTo(models.Ad, {
      foreignKey: 'ad_id',
      as: 'ad'
    });

    // Belongs to an Admin (User) who performed the action
    AdVerificationHistory.belongsTo(models.User, {
      foreignKey: 'admin_id',
      as: 'admin'
    });
  };

  // Static methods for common queries
  AdVerificationHistory.getAdHistory = function(adId, limit = 50) {
    return this.findAll({
      where: { ad_id: adId },
      order: [['created_at', 'DESC']],
      limit: limit,
      include: [{
        model: sequelize.models.User,
        as: 'admin',
        attributes: ['id', 'name', 'role']
      }]
    });
  };

  AdVerificationHistory.getAdminActions = function(adminId, limit = 100) {
    return this.findAll({
      where: { admin_id: adminId },
      order: [['created_at', 'DESC']],
      limit: limit,
      include: [{
        model: sequelize.models.Ad,
        as: 'ad',
        attributes: ['id', 'title', 'status']
      }]
    });
  };

  // Instance methods
  AdVerificationHistory.prototype.getActionDescription = function() {
    const actionDescriptions = {
      'submitted': 'Ad submitted for review',
      'approved': 'Ad approved by admin',
      'rejected': 'Ad rejected by admin',
      'appeal_submitted': 'Appeal submitted by advertiser',
      'appeal_approved': 'Appeal approved by admin',
      'appeal_rejected': 'Appeal rejected by admin'
    };
    return actionDescriptions[this.action] || this.action;
  };

  AdVerificationHistory.prototype.isAdminAction = function() {
    return ['approved', 'rejected', 'appeal_approved', 'appeal_rejected'].includes(this.action);
  };

  return AdVerificationHistory;
};
