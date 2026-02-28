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
    validate: {
      isInt: true,
      min: 0,
      max: 30,
    },
  },
});

module.exports = { Pet };
