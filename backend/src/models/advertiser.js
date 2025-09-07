// backend/src/models/advertiser.js

module.exports = (sequelize, DataTypes) => {
  const Advertiser = sequelize.define(
    'Advertiser',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      civil_id: {
        type: DataTypes.STRING,
        allowNull: true // ← allowNull because not required for advertiser login
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      company_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      license_number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      signatory_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      license_doc: {
        type: DataTypes.STRING,
        allowNull: true // this is the path to uploaded document
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'advertiser'
      },
      kyc_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
      }
    },
    {
      tableName: 'Advertisers',
      underscored: true,
      timestamps: true
    }
  );

  Advertiser.associate = models => {
    Advertiser.hasMany(models.Video, {
      foreignKey: 'advertiser_id',
      as: 'ads'
    });

    Advertiser.hasOne(models.Wallet, {
      foreignKey: 'owner_id',
      constraints: false,
      scope: {
        owner_type: 'advertiser'
      },
      as: 'wallet'
    });
  };

  return Advertiser;
};