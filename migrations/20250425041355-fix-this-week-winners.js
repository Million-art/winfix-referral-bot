'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if the table exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('this_week_winners'));

    if (!tableExists) {
      // Create the table if it doesn't exist
      await queryInterface.createTable('this_week_winners', {
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
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    } else {
      // If table exists, make sure the website ENUM is correct
      try {
        // First convert to string to remove any existing ENUM
        await queryInterface.changeColumn('this_week_winners', 'website', {
          type: Sequelize.STRING,
          allowNull: false
        });

        // Then add the correct ENUM values
        await queryInterface.changeColumn('this_week_winners', 'website', {
          type: Sequelize.ENUM('winfix.live', 'autoexch.live', 've567.live', 've777.club', 'vikrant247.com'),
          allowNull: false
        });
      } catch (error) {
        console.error('Error updating website column:', error);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // No down action needed as this is a fix
  }
};
