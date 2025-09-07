// backend/src/models/section.js
module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define(
    'Section',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '#1976d2'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      ad_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'sections',
      underscored: true,
      timestamps: true
    }
  );

  Section.associate = models => {
    Section.hasMany(models.Ad, {
      foreignKey: 'section',
      sourceKey: 'key',
      as: 'ads'
    });
  };

  return Section;
};