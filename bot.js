const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const initializeBot = require('./bot/setup');

// Export a function that takes a bot instance
module.exports = function(bot) {
  // Initialize the bot with all handlers and middleware
  initializeBot(bot);
};

