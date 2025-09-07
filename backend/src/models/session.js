// backend/src/models/session.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 compatible
      allowNull: false
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_activity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sessions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['token']
      },
      {
        fields: ['ip_address']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  Session.associate = function(models) {
    Session.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Session;
}; 