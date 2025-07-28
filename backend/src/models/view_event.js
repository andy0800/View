// backend/src/models/view_event.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ViewEvent = sequelize.define('ViewEvent', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'videos', key: 'id' }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName:   'view_events',
    underscored: true,
    timestamps:  false
  });

  ViewEvent.associate = models => {
    ViewEvent.belongsTo(models.Video, { foreignKey: 'video_id', as: 'video' });
    ViewEvent.belongsTo(models.User,  { foreignKey: 'user_id',  as: 'user' });
  };

  return ViewEvent;
};