// backend/src/models/video.js
module.exports = (sequelize, DataTypes) => {
  const Video = sequelize.define(
    'Video',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // NEW: track which sections this video belongs to
      sections: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      spent: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'Videos',
      underscored: true
    }
  )

  Video.associate = models => {
    Video.belongsTo(models.User, {
      as: 'advertiser',
      foreignKey: 'advertiser_id'
    })
  }

  return Video
}