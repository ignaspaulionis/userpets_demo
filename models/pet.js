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
      isInt: {
        msg: 'Age must be a non-negative integer',
      },
      min: {
        args: [0],
        msg: 'Age must be a non-negative integer',
      },
    },
  },
});

module.exports = { Pet };
