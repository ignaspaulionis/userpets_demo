const path = require('path');
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const dbStorage = process.env.DB_STORAGE
  ? path.resolve(process.cwd(), process.env.DB_STORAGE)
  : (isTest ? ':memory:' : path.join(__dirname, '..', 'database.sqlite'));

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbStorage,
  logging: false,
});

module.exports = sequelize;
