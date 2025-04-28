'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('monthly_winners', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      month_year: {
        type: Sequelize.STRING,
        allowNull: false
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
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      website: {
        type: Sequelize.ENUM('winfix.live', 'autoexch.live', 've567.live', 've777.club', 'vikrant247.com'),
        allowNull: false
      },
      web_username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      referral_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });

    // Add indexes
    await queryInterface.addIndex('monthly_winners', ['month_year']);
    await queryInterface.addIndex('monthly_winners', ['month_year', 'telegram_id'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('monthly_winners');
  }
}; 