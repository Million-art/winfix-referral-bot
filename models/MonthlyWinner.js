const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonthlyWinner extends Model {
    static associate(models) {
      // Define association here
      MonthlyWinner.belongsTo(models.User, {
        foreignKey: 'telegram_id',
        targetKey: 'telegram_id'
      });
    }
  }
  
  MonthlyWinner.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    month_year: {
      type: DataTypes.STRING, // Format: "June 2023"
      allowNull: false
    },
    telegram_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    website: {
      type: DataTypes.ENUM('winfix.live', 'autoexch.live', 've567.live', 've777.club', 'vikrant247.com'),
      allowNull: false
    },
    web_username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referral_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'MonthlyWinner',
    tableName: 'monthly_winners',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['month_year', 'telegram_id'] },
      { fields: ['month_year'] }
    ]
  });
  
  return MonthlyWinner;
};