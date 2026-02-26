const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
});

module.exports = { Pet };
