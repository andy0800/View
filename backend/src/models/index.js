// backend/src/models/index.js
'use strict';

require('dotenv').config();
const fs        = require('fs');
const path      = require('path');
const Sequelize = require('sequelize');
const basename  = path.basename(__filename);
const db        = {};

// 1) Instantiate Sequelize from .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

// 2) Dynamically load all model files
fs
  .readdirSync(__dirname)
  .filter(f =>
    f.indexOf('.') !== 0 &&
    f !== basename &&
    f.slice(-3) === '.js'
  )
  .forEach(f => {
    const def = require(path.join(__dirname, f));
    if (typeof def === 'function') {
      const model = def(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    }
  });

// 3) Run associations
Object.keys(db).forEach(name => {
  if (db[name].associate) {
    db[name].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
