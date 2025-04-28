const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ThisWeekWinner extends Model {
    static associate(models) {
      // Define association here
      ThisWeekWinner.belongsTo(models.User, {
        foreignKey: 'telegram_id',
        targetKey: 'telegram_id'
      });
    }
  }
  ThisWeekWinner.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    telegram_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referral_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    website: {
      type: DataTypes.ENUM('winfix.live', 'autoexch.live', 've567.live', 've777.club', 'vikrant247.com'),
      allowNull: false
    },
    web_username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ThisWeekWinner',
    tableName: 'this_week_winners',
    timestamps: false
  });
  return ThisWeekWinner;
};
