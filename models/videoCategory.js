const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Video = require('./video');

const VideoCategory = sequelize.define(
  'VideoCategory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    video_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'video_categories',
    timestamps: false,
  }
);

Video.hasMany(VideoCategory, { foreignKey: 'video_id' });
VideoCategory.belongsTo(Video, { foreignKey: 'video_id' });

module.exports = VideoCategory;
