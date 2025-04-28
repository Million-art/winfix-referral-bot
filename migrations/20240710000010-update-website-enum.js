'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove the ENUM constraint
    await queryInterface.changeColumn('this_week_winners', 'website', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Then add the new ENUM
    await queryInterface.changeColumn('this_week_winners', 'website', {
      type: Sequelize.ENUM('winfix.live', 'autoexch.live', 've567.live', 've777.club', 'vikrant247.com'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // First, remove the new ENUM constraint
    await queryInterface.changeColumn('this_week_winners', 'website', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Then restore the original ENUM
    await queryInterface.changeColumn('this_week_winners', 'website', {
      type: Sequelize.ENUM('twitter', 'telegram', 'discord'),
      allowNull: false
    });
  }
}; 