'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      'Events',
      [
        {
          eventId: 'node-meetup-2025',
          name: 'Node.js Meet-up',
          totalSeats: 500,
          availableSeats: 500,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      'Events',
      { eventId: 'node-meetup-2025' },
      {}
    );
  },
};