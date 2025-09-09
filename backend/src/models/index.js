// backend/src/models/index.js
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// 1) Set up Sequelize connection
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
      }
    );

// 2) Dynamically load all models (except this file)
fs.readdirSync(__dirname)
  .filter(file =>
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js'
  )
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    if (typeof modelDef === 'function') {
      const model = modelDef(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    }
  });

// ✅ 3) Manual fallback for Viewer (in case missed)
if (!db.Viewer) {
  const Viewer = require('./viewer')(sequelize, Sequelize.DataTypes);
  db.Viewer = Viewer;
}

// ✅ 4) Manual fallback for Advertiser
if (!db.Advertiser) {
  const Advertiser = require('./advertiser')(sequelize, Sequelize.DataTypes);
  db.Advertiser = Advertiser;
}

// ✅ 5) Manual fallback for PurchasedPackage
if (!db.PurchasedPackage) {
  const PurchasedPackage = require('./purchased_package')(sequelize, Sequelize.DataTypes);
  db.PurchasedPackage = PurchasedPackage;
}

// ✅ 6) Manual fallback for Transaction
if (!db.Transaction) {
  const Transaction = require('./transaction')(sequelize, Sequelize.DataTypes);
  db.Transaction = Transaction;
}

// ✅ 7) Manual fallback for CompanyWallet
if (!db.CompanyWallet) {
  const CompanyWallet = require('./companyWallet')(sequelize, Sequelize.DataTypes);
  db.CompanyWallet = CompanyWallet;
}

// ✅ 8) Manual fallback for Session
if (!db.Session) {
  const Session = require('./session')(sequelize, Sequelize.DataTypes);
  db.Session = Session;
}

// ✅ 9) Manual fallback for OtpCode
if (!db.OtpCode) {
  const OtpCode = require('./otp_code')(sequelize, Sequelize.DataTypes);
  db.OtpCode = OtpCode;
}

// ✅ 10) Manual fallback for Withdrawal
if (!db.Withdrawal) {
  const Withdrawal = require('./withdrawal')(sequelize, Sequelize.DataTypes);
  db.Withdrawal = Withdrawal;
}

// ✅ 11) Manual fallback for Notification
if (!db.Notification) {
  const Notification = require('./notification')(sequelize, Sequelize.DataTypes);
  db.Notification = Notification;
}

// ✅ 12) Manual fallback for Comment
if (!db.Comment) {
  const Comment = require('./comment')(sequelize, Sequelize.DataTypes);
  db.Comment = Comment;
}

// ✅ 13) Manual fallback for CommentLike
if (!db.CommentLike) {
  const CommentLike = require('./commentLike')(sequelize, Sequelize.DataTypes);
  db.CommentLike = CommentLike;
}

// ✅ 14) Manual fallback for AdAppeal
if (!db.AdAppeal) {
  const AdAppeal = require('./adAppeal')(sequelize, Sequelize.DataTypes);
  db.AdAppeal = AdAppeal;
}

// ✅ 15) Manual fallback for AdVerificationHistory
if (!db.AdVerificationHistory) {
  const AdVerificationHistory = require('./adVerificationHistory')(sequelize, Sequelize.DataTypes);
  db.AdVerificationHistory = AdVerificationHistory;
}

// 5) Register associations if defined
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Disable sync in production to prevent model sync conflicts
if (process.env.NODE_ENV === 'production') {
  console.log('🔄 Disabling model sync in production...');
  
  // Override sequelize.sync() to do nothing in production
  sequelize.sync = function(options) {
    console.log('🔄 Model sync disabled in production');
    return Promise.resolve();
  };
  
  // Override individual model sync methods
  Object.keys(db).forEach(modelName => {
    if (db[modelName] && typeof db[modelName].sync === 'function') {
      db[modelName].sync = function(options) {
        console.log(`🔄 Model ${modelName} sync disabled in production`);
        return Promise.resolve();
      };
    }
  });
  
  console.log('✅ Model sync disabled for all models in production');
}

module.exports = db;