const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations here
      User.hasMany(models.ThisWeekWinner, {
        foreignKey: 'telegram_id',
        sourceKey: 'telegram_id'
      });
      User.hasMany(models.WeeklyWinner, {
        foreignKey: 'telegram_id',
        sourceKey: 'telegram_id'
      });
      User.hasMany(models.MonthlyWinner, {
        foreignKey: 'telegram_id',
        sourceKey: 'telegram_id'
      });
      User.hasMany(models.Referral, {
        foreignKey: 'telegram_id',
        sourceKey: 'telegram_id'
      });
    }
  }
  
  User.init({
    telegram_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    left: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return User;
};