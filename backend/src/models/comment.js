// backend/src/models/comment.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
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

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000] // Max 1000 characters
      }
    },

    likes_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    replies_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'comments', key: 'id' },
      onDelete: 'CASCADE'
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }

  }, {
    tableName: 'comments',
    underscored: true,
    timestamps: true,
    paranoid: true, // Enable soft deletes
    deletedAt: 'deleted_at'
  });

  Comment.associate = models => {
    // Belongs to an Ad
    Comment.belongsTo(models.Ad, {
      foreignKey: 'ad_id',
      as: 'ad'
    });

    // Belongs to a User (viewer)
    Comment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Self-referencing for replies
    Comment.belongsTo(models.Comment, {
      foreignKey: 'parent_id',
      as: 'parent'
    });

    Comment.hasMany(models.Comment, {
      foreignKey: 'parent_id',
      as: 'replies'
    });

    // Has many likes
    Comment.hasMany(models.CommentLike, {
      foreignKey: 'comment_id',
      as: 'likes'
    });
  };

  return Comment;
};
