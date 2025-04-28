'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('referrals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      telegram_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'telegram_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      referred_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true
      },
      referred_username: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      referral_status: {
        type: Sequelize.ENUM('new', 'counted', 'end'),
        defaultValue: 'new',
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      is_real_referral: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('referrals', ['referral_status']);
    await queryInterface.addIndex('referrals', ['telegram_id', 'referred_id']);
    await queryInterface.addIndex('referrals', ['referred_id'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('referrals');
  }
}; 