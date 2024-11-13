const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');  // Import the sequelize instance

// Define the Pet model
const Pet = sequelize.define('Pet', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Sync the model with the database (create the table if it doesn't exist)
sequelize.sync()
  .then(() => console.log('Pet table has been created or verified!'))
  .catch((err) => console.error('Error syncing the database:', err));

module.exports = { Pet };
