// backend/src/models/video.js
// This model is kept for backward compatibility but functionality moved to Ad model
module.exports = (sequelize, DataTypes) => {
  const Video = sequelize.define(
    'Video',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
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
      budget: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      advertiser_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      underscored: true,
      timestamps: true
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