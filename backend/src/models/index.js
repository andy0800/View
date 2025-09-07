// backend/src/models/index.js
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// 1) Set up Sequelize connection
const sequelize = new Sequelize(
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

module.exports = db;