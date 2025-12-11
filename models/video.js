const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');

const Video = sequelize.define(
  'Video',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filepath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filesize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'videos',
    timestamps: true,
  }
);

User.hasMany(Video, { foreignKey: 'user_id' });
Video.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Video;
