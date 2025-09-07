// backend/src/models/viewer.js

module.exports = (sequelize, DataTypes) => {
  const Viewer = sequelize.define('Viewer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    civil_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    civil_front: {
      type: DataTypes.STRING,
      allowNull: true
    },
    civil_back: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kyc_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'viewer' // ✅ Crucial for auth to recognize role
    }
  }, {
    tableName: 'Viewers'
  });

  return Viewer;
};