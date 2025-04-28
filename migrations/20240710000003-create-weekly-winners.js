'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('weekly_winners', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      week_number: {
        type: Sequelize.INTEGER,
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
      referral_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      website: {
        type: Sequelize.ENUM('winfix.live', 'autoexch.live', 've567.live', 've777.club', 'vikrant247.com'),
        allowNull: false
      },
      web_username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('weekly_winners', ['week_number']);
    await queryInterface.addIndex('weekly_winners', ['week_number', 'telegram_id'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('weekly_winners');
  }
}; 