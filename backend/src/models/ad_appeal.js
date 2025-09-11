// backend/src/models/ad_appeal.js
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
      references: {
        model: 'ads',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    advertiser_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    appeal_reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    appeal_evidence: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    appeal_deadline: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ad_appeals',
    underscored: true,
    timestamps: true
  });

  AdAppeal.associate = models => {
    AdAppeal.belongsTo(models.Ad, {
      foreignKey: 'ad_id',
      as: 'ad'
    });
    
    AdAppeal.belongsTo(models.User, {
      foreignKey: 'advertiser_id',
      as: 'advertiser'
    });
    
    AdAppeal.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      as: 'reviewer'
    });
  };

  return AdAppeal;
};
