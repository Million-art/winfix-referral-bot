const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WeekTracker extends Model {
    static associate(models) {
      // No associations needed for WeekTracker
    }
  }
  
  WeekTracker.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    current_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'WeekTracker',
    tableName: 'week_tracker',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return WeekTracker;
}; 