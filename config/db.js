const path = require('path');
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : path.join(__dirname, '..', 'database.sqlite'),
  logging: false,
});

module.exports = sequelize;
