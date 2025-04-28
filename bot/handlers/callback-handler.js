/**
 * Handler for callback queries
 */
const { registerUser } = require('../../services/user.js');
const { countMyWeeklyReferrals } = require('../../services/user.js');

function setupCallbackHandler(bot) {
  // General callback handler
  bot.on("callback_query", async (ctx, next) => {
    console.log('Raw callback data:', ctx.callbackQuery.data);
    
    // Only handle specific cases
    if (ctx.callbackQuery.data === "get_my_referral") {
      await ctx.deleteMessage();
      await registerUser(ctx);
      return ctx.answerCbQuery("");
    } 
    else if (ctx.callbackQuery.data === "joined_channel") {
      await ctx.deleteMessage();
      await registerUser(ctx);
      return ctx.answerCbQuery("");
    } 
    else if (ctx.callbackQuery.data === "referred_users_number") {
      return countMyWeeklyReferrals(ctx);
    }
    
    // Pass all other callbacks to next handlers
    await next();
  });
}

module.exports = setupCallbackHandler; 