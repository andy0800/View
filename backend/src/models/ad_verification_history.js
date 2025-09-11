// backend/src/models/ad_verification_history.js
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
      references: {
        model: 'ads',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    action: {
      type: DataTypes.ENUM('submitted', 'reviewed', 'approved', 'rejected', 'appealed', 'appeal_approved', 'appeal_rejected'),
      allowNull: false
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'ad_verification_history',
    underscored: true,
    timestamps: true
  });

  AdVerificationHistory.associate = models => {
    AdVerificationHistory.belongsTo(models.Ad, {
      foreignKey: 'ad_id',
      as: 'ad'
    });
    
    AdVerificationHistory.belongsTo(models.User, {
      foreignKey: 'admin_id',
      as: 'admin'
    });
  };

  return AdVerificationHistory;
};
