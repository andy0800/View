// backend/src/models/wallet.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Links to either Viewer.id or Advertiser.id (polymorphic)',
    },
    balance_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Balance in micro units (1,000,000 = 1 KWD)'
    },
    held_micro: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Held balance in micro units (for pending transactions)'
    },
    confirmed_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Legacy field - maintained for backward compatibility'
    },
    pending_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Legacy field - maintained for backward compatibility'
    }
  }, {
    tableName: 'wallets',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
        unique: true
      },
      {
        fields: ['balance_micro']
      }
    ]
  });

  // Instance methods for micro-unit calculations
  Wallet.prototype.getBalanceKWD = function() {
    return this.balance_micro / 1_000_000;
  };

  Wallet.prototype.getHeldKWD = function() {
    return this.held_micro / 1_000_000;
  };

  Wallet.prototype.getAvailableBalanceKWD = function() {
    return (this.balance_micro - this.held_micro) / 1_000_000;
  };

  Wallet.prototype.getAvailableBalanceMicro = function() {
    return this.balance_micro - this.held_micro;
  };

  // Instance methods for balance operations
  Wallet.prototype.addBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion to prevent string concatenation
    const currentBalance = parseInt(this.balance_micro || 0);
    const newAmount = parseInt(amountMicro);
    
    // ✅ ADDED: Safety check to ensure all values are numbers
    if (isNaN(currentBalance) || isNaN(newAmount)) {
      throw new Error('Invalid numeric values detected in wallet');
    }

    this.balance_micro = currentBalance + newAmount;
    await this.save({ transaction });
    return this.balance_micro;
  };

  Wallet.prototype.deductBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentBalance = parseInt(this.balance_micro || 0);
    const newAmount = parseInt(amountMicro);
    
    // ✅ ADDED: Safety check to ensure all values are numbers
    if (isNaN(currentBalance) || isNaN(newAmount)) {
      throw new Error('Invalid numeric values detected in wallet');
    }

    if (currentBalance < newAmount) {
      throw new Error('Insufficient balance');
    }

    this.balance_micro = currentBalance - newAmount;
    await this.save({ transaction });
    return this.balance_micro;
  };

  Wallet.prototype.holdBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentBalance = parseInt(this.balance_micro || 0);
    const currentHeld = parseInt(this.held_micro || 0);
    const newAmount = parseInt(amountMicro);
    
    // ✅ ADDED: Safety check to ensure all values are numbers
    if (isNaN(currentBalance) || isNaN(currentHeld) || isNaN(newAmount)) {
      throw new Error('Invalid numeric values detected in wallet');
    }
    
    if (currentBalance < (currentHeld + newAmount)) {
      throw new Error('Insufficient available balance');
    }

    this.held_micro = currentHeld + newAmount;
    await this.save({ transaction });
    return this.held_micro;
  };

  Wallet.prototype.releaseHeldBalance = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentHeld = parseInt(this.held_micro || 0);
    const newAmount = parseInt(amountMicro);
    
    // ✅ ADDED: Safety check to ensure all values are numbers
    if (isNaN(currentHeld) || isNaN(newAmount)) {
      throw new Error('Invalid numeric values detected in wallet');
    }

    if (currentHeld < newAmount) {
      throw new Error('Insufficient held balance');
    }

    this.held_micro = currentHeld - newAmount;
    await this.save({ transaction });
    return this.held_micro;
  };

  Wallet.prototype.transferToHeld = async function(amountMicro, transaction) {
    if (amountMicro <= 0) {
      throw new Error('Amount must be positive');
    }

    // ✅ FIXED: Ensure proper type conversion
    const currentBalance = parseInt(this.balance_micro || 0);
    const currentHeld = parseInt(this.held_micro || 0);
    const newAmount = parseInt(amountMicro);
    
    // ✅ ADDED: Safety check to ensure all values are numbers
    if (isNaN(currentBalance) || isNaN(currentHeld) || isNaN(newAmount)) {
      throw new Error('Invalid numeric values detected in wallet');
    }

    if (currentBalance < newAmount) {
      throw new Error('Insufficient balance');
    }

    this.balance_micro = currentBalance - newAmount;
    this.held_micro = currentHeld + newAmount;
    await this.save({ transaction });
    
    return {
      balance_micro: this.balance_micro,
      held_micro: this.held_micro
    };
  };

  // Class methods for wallet management
  Wallet.findByUserId = function(userId) {
    return this.findOne({
      where: { user_id: userId }
    });
  };

  Wallet.createForUser = function(userId, initialBalanceMicro = 0) {
    return this.create({
      user_id: userId,
      balance_micro: initialBalanceMicro,
      held_micro: 0
    });
  };

  Wallet.getOrCreateForUser = async function(userId, initialBalanceMicro = 0) {
    let wallet = await this.findByUserId(userId);
    
    if (!wallet) {
      wallet = await this.createForUser(userId, initialBalanceMicro);
    }
    
    return wallet;
  };

  Wallet.associate = models => {
    Wallet.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Wallet;
};
