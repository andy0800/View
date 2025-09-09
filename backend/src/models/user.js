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
      type: DataTypes.STRING,
      allowNull: true
    },
    license_number: { 
      type: DataTypes.STRING,
      allowNull: true
    },
    signatory_name: { 
      type: DataTypes.STRING,
      allowNull: true
    },
    license_doc_key: { 
      type: DataTypes.STRING,
      allowNull: true
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
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

        // Role-specific validation
        if (user.role === 'viewer') {
          // Viewers must have civil_id and documents
          if (!user.civil_id) {
            throw new Error('Civil ID is required for viewers');
          }
          if (!user.civil_front_key || !user.civil_back_key) {
            throw new Error('Civil ID documents are required for viewers');
          }
        } else if (user.role === 'advertiser') {
          // Advertisers must have company information
          if (!user.company_name) {
            throw new Error('Company name is required for advertisers');
          }
          if (!user.license_number) {
            throw new Error('License number is required for advertisers');
          }
          if (!user.signatory_name) {
            throw new Error('Signatory name is required for advertisers');
          }
          if (!user.license_doc_key) {
            throw new Error('License document is required for advertisers');
          }
        }
      }
    }
  });

  // Instance methods for role-specific functionality
  User.prototype.isViewer = function() {
    return this.role === 'viewer';
  };

  User.prototype.isAdvertiser = function() {
    return this.role === 'advertiser';
  };

  User.prototype.isAdmin = function() {
    return this.role === 'admin';
  };

  User.prototype.getRequiredFields = function() {
    if (this.role === 'viewer') {
      return ['name', 'phone', 'civil_id', 'civil_front_key', 'civil_back_key'];
    } else if (this.role === 'advertiser') {
      return ['name', 'phone', 'company_name', 'license_number', 'signatory_name', 'license_doc_key'];
    }
    return ['name', 'phone'];
  };

  User.prototype.getDisplayName = function() {
    if (this.role === 'advertiser' && this.company_name) {
      return this.company_name;
    }
    return this.name;
  };

  // Class methods for role-specific queries
  User.getViewers = function() {
    return this.findAll({
      where: { role: 'viewer' },
      include: [
        { model: this.sequelize.models.Wallet, as: 'wallet' }
      ]
    });
  };

  User.getAdvertisers = function() {
    return this.findAll({
      where: { role: 'advertiser' },
      include: [
        { model: this.sequelize.models.Wallet, as: 'wallet' }
      ]
    });
  };

  User.getAdmins = function() {
    return this.findAll({
      where: { role: 'admin' }
    });
  };

  User.associate = models => {
    // Core associations
    User.hasOne(models.Wallet, { 
      foreignKey: 'user_id',   
      as: 'wallet' 
    });
    
    // User's own data
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
    User.hasMany(models.PurchasedPackage, {
      foreignKey: 'user_id',
      as: 'purchasedPackages'
    });
    User.hasMany(models.Comment, {
      foreignKey: 'user_id',
      as: 'comments'
    });
    User.hasMany(models.CommentLike, {
      foreignKey: 'user_id',
      as: 'commentLikes'
    });
    User.hasMany(models.Session, {
      foreignKey: 'user_id',
      as: 'sessions'
    });
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
    User.hasMany(models.OtpCode, {
      foreignKey: 'phone',
      sourceKey: 'phone',
      as: 'otpCodes'
    });

    // Advertiser associations
    User.hasMany(models.Ad, { 
      foreignKey: 'advertiser_id', 
      as: 'ads' 
    });
    User.hasMany(models.AdAppeal, {
      foreignKey: 'advertiser_id',
      as: 'adAppeals'
    });

    // Admin associations
    User.hasMany(models.AdAppeal, {
      foreignKey: 'reviewed_by',
      as: 'reviewedAppeals'
    });
    User.hasMany(models.AdVerificationHistory, {
      foreignKey: 'admin_id',
      as: 'verificationHistory'
    });
    User.hasMany(models.Ad, {
      foreignKey: 'verified_by',
      as: 'verifiedAds'
    });
    User.hasMany(models.AdminSettings, {
      foreignKey: 'updated_by',
      as: 'updatedSettings'
    });
    User.hasMany(models.CompanyWallet, {
      foreignKey: 'updated_by',
      as: 'updatedCompanyWallets'
    });
    
    // Self-referencing for admin verification
    User.belongsTo(models.User, {
      foreignKey: 'verified_by',
      as: 'verifier'
    });
  };

  return User;
};