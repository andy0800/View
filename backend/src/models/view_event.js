// backend/src/models/view_event.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const { Op } = require('sequelize');
  const ViewEvent = sequelize.define('ViewEvent', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    ad_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'ads', key: 'id' }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    purchased_package_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'purchased_packages', key: 'id' }
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'advertiser_packages', key: 'id' }
    },
    proof_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'HMAC proof token for view validation'
    },
    proof_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When proof token expires'
    },
    charged_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Amount charged in micro units'
    },
    viewer_reward_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Viewer reward in micro units'
    },
    company_share_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Company share in micro units'
    },
    // Legacy KWD-denominated fields to support older schemas
    viewer_reward: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    company_fee: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    total_cost: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    watched_duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual milliseconds watched'
    },
    required_duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Required milliseconds from package'
    },
    // Legacy duration columns
    completion_duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    required_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    // Store these only in memory (legacy DBs may not have columns)
    ip_hash: {
      type: DataTypes.VIRTUAL,
      get() { return null; },
      set() {}
    },
    user_agent_hash: {
      type: DataTypes.VIRTUAL,
      get() { return null; },
      set() {}
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'view_events',
    underscored: true,
    timestamps: false,
    defaultScope: {
      // Exclude optional columns that may not exist in legacy DBs
      attributes: { exclude: ['ip_hash', 'user_agent_hash'] }
    },
    scopes: {
      withHashes: {
        attributes: { include: ['ip_hash', 'user_agent_hash'] }
      }
    },
    indexes: [
      {
        fields: ['ad_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['purchased_package_id']
      },
      {
        fields: ['proof_token'],
        unique: true
      },
      {
        fields: ['proof_token_expires_at']
      },
      {
        fields: ['is_completed']
      },
      {
        fields: ['viewed_at']
      }
    ]
  });

  // Instance methods for micro-unit calculations
  ViewEvent.prototype.getChargedKWD = function() {
    return this.charged_micro / 1_000_000;
  };

  ViewEvent.prototype.getViewerRewardKWD = function() {
    return this.viewer_reward_micro / 1_000_000;
  };

  ViewEvent.prototype.getCompanyShareKWD = function() {
    return this.company_share_micro / 1_000_000;
  };

  ViewEvent.prototype.getWatchedDurationSeconds = function() {
    return this.watched_duration_ms ? Math.round(this.watched_duration_ms / 1000) : 0;
  };

  ViewEvent.prototype.getRequiredDurationSeconds = function() {
    return Math.round(this.required_duration_ms / 1000);
  };

  ViewEvent.prototype.isWatchedEnough = function() {
    if (!this.watched_duration_ms) return false;
    // Must watch at least 95% of required duration
    return this.watched_duration_ms >= (this.required_duration_ms * 0.95);
  };

  ViewEvent.prototype.isProofTokenExpired = function() {
    return new Date() > this.proof_token_expires_at;
  };

  // Class methods for view event management
  ViewEvent.findByProofToken = function(proofToken) {
    return this.findOne({
      where: { proof_token: proofToken }
    });
  };

  ViewEvent.findActiveByUserAndAd = function(userId, adId) {
    return this.findOne({
      where: {
        user_id: userId,
        ad_id: adId,
        is_completed: false,
        proof_token_expires_at: { [Op.gt]: new Date() }
      }
    });
  };

  ViewEvent.findCompletedByUserAndAd = function(userId, adId) {
    return this.findOne({
      where: {
        user_id: userId,
        ad_id: adId,
        is_completed: true
      }
    });
  };

  // Enhanced fraud detection methods
  ViewEvent.detectFraudPatterns = async function(userId, adId) {
    const recentViews = await this.findAll({
      where: {
        user_id: userId,
        is_completed: true,
        completed_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      attributes: ['ad_id', 'completed_at']
    });

    const fraudIndicators = {
      multipleViewsSameAd: false,
      rapidViews: false,
      ipAnomaly: false,
      uaAnomaly: false
    };

    // Check for multiple views of the same ad
    const sameAdViews = recentViews.filter(view => view.ad_id === adId);
    if (sameAdViews.length > 0) {
      fraudIndicators.multipleViewsSameAd = true;
    }

    // Check for rapid successive views
    if (recentViews.length > 1) {
      const sortedViews = recentViews.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
      for (let i = 1; i < sortedViews.length; i++) {
        const timeDiff = new Date(sortedViews[i].completed_at) - new Date(sortedViews[i-1].completed_at);
        if (timeDiff < 5000) { // Less than 5 seconds between views
          fraudIndicators.rapidViews = true;
          break;
        }
      }
    }

    return fraudIndicators;
  };

  // Enhanced view completion validation
  ViewEvent.validateViewCompletion = function(watchedMs, requiredMs, proofTokenExpiry) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if proof token is expired
    if (new Date() > proofTokenExpiry) {
      validation.isValid = false;
      validation.errors.push('Proof token has expired');
    }

    // Check if watched duration meets minimum requirement (95% of required duration)
    const minRequiredMs = Math.floor(requiredMs * 0.95);
    if (watchedMs < minRequiredMs) {
      validation.isValid = false;
      validation.errors.push(`Watched duration (${watchedMs}ms) is below minimum requirement (${minRequiredMs}ms)`);
    }

    // Check for suspicious viewing patterns
    if (watchedMs < requiredMs * 0.5) {
      validation.warnings.push('Viewing duration is significantly below required duration');
    }

    if (watchedMs > requiredMs * 1.5) {
      validation.warnings.push('Viewing duration is significantly above required duration');
    }

    return validation;
  };

  ViewEvent.associate = models => {
    ViewEvent.belongsTo(models.Ad, { 
      foreignKey: 'ad_id', 
      as: 'ad' 
    });
    ViewEvent.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
    ViewEvent.belongsTo(models.PurchasedPackage, { 
      foreignKey: 'purchased_package_id', 
      as: 'purchasedPackage' 
    });
    ViewEvent.belongsTo(models.AdvertiserPackage, { 
      foreignKey: 'package_id', 
      as: 'package' 
    });
  };

  return ViewEvent;
};