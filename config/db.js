const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';

// Use in-memory SQLite for tests, file-based for development/production
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : './database.sqlite',
  logging: false,
});

if (!isTest) {
  sequelize
    .authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch((err) => console.error('Unable to connect to the database:', err));
}

module.exports = sequelize;
