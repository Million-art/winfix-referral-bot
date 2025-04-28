'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'referral_code');
    await queryInterface.removeColumn('users', 'referred_by');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'referral_code', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
    await queryInterface.addColumn('users', 'referred_by', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
}; 