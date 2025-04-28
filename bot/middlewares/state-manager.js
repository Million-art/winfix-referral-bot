/**
 * State management middleware for the Telegram bot
 */

// Initialize global state storage
const pendingSelections = new Map();

// Middleware to attach state to context
function setupStateManager(bot) {
  bot.use(async (ctx, next) => {
    ctx.state = ctx.state || {};
    ctx.state.pendingSelections = pendingSelections;
    await next();
  });
}

module.exports = {
  setupStateManager,
  pendingSelections
}; 