// backend/src/models/adAppeal.js
// Model for handling advertiser appeals against rejected ads

'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdAppeal = sequelize.define('AdAppeal', {
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

    advertiser_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },

    appeal_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 1000] // Minimum 10 characters, maximum 1000
      }
    },

    appeal_evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000] // Maximum 2000 characters
      }
    },

    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },

    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Maximum 1000 characters
      }
    },

    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    },

    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    appeal_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Deadline for admin to respond to appeal (7 days)'
    }

  }, {
    tableName: 'ad_appeals',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  AdAppeal.associate = models => {
    // Belongs to an Ad
    AdAppeal.belongsTo(models.Ad, {
      foreignKey: 'ad_id',
      as: 'ad'
    });

    // Belongs to an Advertiser (User)
    AdAppeal.belongsTo(models.User, {
      foreignKey: 'advertiser_id',
      as: 'advertiser'
    });

    // Belongs to an Admin (User) who reviewed the appeal
    AdAppeal.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      as: 'reviewer'
    });
  };

  // Instance methods
  AdAppeal.prototype.isOverdue = function() {
    if (!this.appeal_deadline) return false;
    return new Date() > this.appeal_deadline;
  };

  AdAppeal.prototype.canBeReviewed = function() {
    return this.status === 'pending';
  };

  AdAppeal.prototype.setDeadline = function() {
    // Set deadline to 7 days from now
    this.appeal_deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  return AdAppeal;
};
