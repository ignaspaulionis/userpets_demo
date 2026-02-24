const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';

// Use SQLite for the database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : './database.sqlite',
  logging: false,
});

module.exports = sequelize;
