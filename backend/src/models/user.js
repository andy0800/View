// backend/src/models/user.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
      allowNull: true, // Allow null for advertisers
      unique: true,
      validate: {
        // Custom validation: either null (for advertisers) or exactly 12 digits (for viewers)
        customValidator(value) {
          if (value !== null && value !== undefined && value !== '') {
            if (value.length !== 12 || !/^\d{12}$/.test(value)) {
              throw new Error('Civil ID must be exactly 12 digits for viewers, or left empty for advertisers');
            }
          }
        }
      }
    },
    phone: { 
      type: DataTypes.STRING,  
      allowNull: false, 
      unique: true,
      validate: {
        is: /^\+965[569]\d{7}$/ // Kuwait phone format
      }
    },
    role: { 
      type: DataTypes.ENUM('viewer','advertiser','admin'), 
      allowNull: false 
    },
    kyc_status: { 
      type: DataTypes.ENUM('pending','verified','rejected'), 
      defaultValue: 'pending' 
    },
    
    // Viewer-specific fields (optional for advertisers)
    civil_front_key: { 
      type: DataTypes.STRING,
      allowNull: true // Allow null for advertisers
    },
    civil_back_key: { 
      type: DataTypes.STRING,
      allowNull: true // Allow null for advertisers
    },
    
    // Advertiser-specific fields
    company_name: { 
      type: DataTypes.STRING 
    },
    license_number: { 
      type: DataTypes.STRING 
    },
    commercial_registration_number: { 
      type: DataTypes.STRING 
    },
    signatory_name: { 
      type: DataTypes.STRING 
    },
    license_doc_key: { 
      type: DataTypes.STRING 
    },
    
    // Account status
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    
    // Verification tracking
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    
    // Hooks for validation
    hooks: {
      beforeValidate: (user) => {
        // Ensure phone number is in correct format
        if (user.phone && !user.phone.startsWith('+965')) {
          if (user.phone.startsWith('965')) {
            user.phone = '+' + user.phone;
          } else if (user.phone.startsWith('0')) {
            user.phone = '+965' + user.phone.substring(1);
          } else {
            user.phone = '+965' + user.phone;
          }
        }
      }
    }
  });

  User.associate = models => {
    User.hasOne(models.Wallet, { 
      foreignKey: 'user_id',   
      as: 'wallet' 
    });
    User.hasMany(models.Withdrawal, { 
      foreignKey: 'user_id',   
      as: 'withdrawals' 
    });
    User.hasMany(models.Transaction, { 
      foreignKey: 'user_id',   
      as: 'transactions' 
    });
    User.hasMany(models.ViewEvent, { 
      foreignKey: 'user_id',   
      as: 'viewEvents' 
    });
    User.hasMany(models.Ad, { 
      foreignKey: 'advertiser_id', 
      as: 'ads' 
    });
    
    // Add comments association
    User.hasMany(models.Comment, {
      foreignKey: 'user_id',
      as: 'comments'
    });

    // Add comment likes association
    User.hasMany(models.CommentLike, {
      foreignKey: 'user_id',
      as: 'commentLikes'
    });
    
    // Self-referencing for admin verification
    User.belongsTo(models.User, {
      foreignKey: 'verified_by',
      as: 'verifier'
    });
  };

  return User;
};