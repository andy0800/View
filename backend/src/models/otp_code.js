// backend/src/models/otp_code.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const OtpCode = sequelize.define('OtpCode', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    phone:     { type: DataTypes.STRING, allowNull: false },
    code:      { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE,   allowNull: false }
  }, {
    tableName:   'otp_codes',
    underscored: true,
    timestamps:  false
  });

  return OtpCode;
};