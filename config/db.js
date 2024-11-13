const { Sequelize } = require('sequelize');

// Use SQLite for the database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',  // SQLite file will be stored in the root of the project
});

sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch((err) => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
