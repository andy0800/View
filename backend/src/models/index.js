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