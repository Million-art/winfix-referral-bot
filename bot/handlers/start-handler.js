/**
 * Handler for the /start command
 */
const { isUserMemberOfChannel } = require('../../helper/channel.js');
const { isUserAlreadyRegistered, registerUser } = require('../../services/user.js');
const { regUserWithReferralNumber } = require('../../services/referralService.js');

function setupStartHandler(bot) {
  bot.start(async (ctx) => {
    try {
      if (ctx.payload) {
        const referralNumber = ctx.payload;
        const isReferralIdValid = await isUserMemberOfChannel(ctx, Number(referralNumber));
        const isReferredUserAlreadyRegistered = await isUserAlreadyRegistered(Number(ctx.from.id));
        
        if (isReferralIdValid && !isReferredUserAlreadyRegistered) {
          await regUserWithReferralNumber(ctx, referralNumber);
          return;
        } else if (isReferredUserAlreadyRegistered) {
          ctx.reply("You have already registered, you cannot be referred again. Send /start to see your referral link.");
          return;
        }
      }
      await registerUser(ctx);
    } catch (error) {
      if (error.message === "You cannot refer yourself.") {
        await ctx.reply("❌ You cannot use your own referral link. Please share your link with others instead!");
      } else if (error.message === "You have already been referred.") {
        await ctx.reply("❌ You have already been referred by someone. Send /start to see your own referral link.");
      } else if (error.message.includes("SequelizeUniqueConstraintError")) {
        await ctx.reply("❌ You have already been referred by someone. Send /start to see your own referral link.");
      } else {
        console.error("Error in start handler:", error);
        await ctx.reply("❌ An unexpected error occurred. Please try again later.");
      }
    }
  });
}

module.exports = setupStartHandler; 