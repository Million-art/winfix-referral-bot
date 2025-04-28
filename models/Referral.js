const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Referral extends Model {
    static associate(models) {
      // Define association here
      Referral.belongsTo(models.User, {
        foreignKey: 'telegram_id',
        targetKey: 'telegram_id'
      });
    }
  }
  
  Referral.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    telegram_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    referred_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true
    },
    referred_username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    referral_status: {
      type: DataTypes.ENUM('new', 'counted', 'end'),
      defaultValue: 'new',
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    is_real_referral: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Referral',
    tableName: 'referrals',
    timestamps: false,
    indexes: [
      { fields: ['referral_status'] },
      { fields: ['telegram_id', 'referred_id'] },
      {
        fields: ['referred_id'],
        unique: true,
      },
    ]
  });
  
  return Referral;
};
