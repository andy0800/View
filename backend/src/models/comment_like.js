// backend/src/models/comment_like.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const CommentLike = sequelize.define('CommentLike', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    comment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'comments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'comment_likes',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['comment_id', 'user_id']
      }
    ]
  });

  CommentLike.associate = models => {
    CommentLike.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });
    
    CommentLike.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return CommentLike;
};
