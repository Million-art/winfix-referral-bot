/**
 * Admin command handlers for the bot
 * Includes ask_username and reset_week
 */
const { validateUserReferrals } = require('../../services/referralService.js');
const { resetWeek } = require('../../services/weekTracker.js');
const { ADMIN, MIN_REFERRAL_COUNT } = require('../../constants.js');
const { Referral } = require('../../models');
const sequelize = require('../../config/db_config.js');

/**
 * Sets up all admin command handlers
 * @param {Object} bot - Telegraf bot instance
 */
function setupAdminHandlers(bot) {
  // Register all admin commands directly with bot.command()
  
  // Command: /ask_username - Request usernames from eligible winners
  bot.command('ask_username', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN) {
      return ctx.reply("🚫 Only admin can use this command");
    }

    try {
      // Find eligible users
      const eligibleUsers = await Referral.findAll({
        attributes: ['telegram_id'],
        where: { referral_status: 'new' },
        group: ['telegram_id'],
        having: sequelize.literal(`COUNT(*) >= ${MIN_REFERRAL_COUNT}`),
      });

      if (eligibleUsers.length === 0) {
        return ctx.reply(`No users currently qualify (need ≥ ${MIN_REFERRAL_COUNT} new referrals). There are no eligible winners.`);
      }

      // Validate referrals
      const validUsers = [];
      for (const user of eligibleUsers) {
        try {
          const isValidUser = await validateUserReferrals(user.telegram_id);
          if (isValidUser) {
            validUsers.push(user);
          }
        } catch (error) {
          console.error(`Failed to validate user ${user.telegram_id}:`, error);
        }
      }

      if (validUsers.length === 0) {
        return ctx.reply("No users currently qualify after validation. There are no eligible winners.");
      }

      // Send website selection to valid users
      for (const user of validUsers) {
        try {
          await ctx.telegram.sendMessage(
            user.telegram_id,
            "🎉 Congratulations! You've qualified for rewards!\n\n" +
            "Please select which website you're playing on:",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "winfix.live", callback_data: "website_winfix.live" },
                    { text: "autoexch.live", callback_data: "website_autoexch.live" },
                  ],
                  [
                    { text: "ve567.live", callback_data: "website_ve567.live" },
                    { text: "ve777.club", callback_data: "website_ve777.club" },
                  ],
                  [
                    { text: "vikrant247.com", callback_data: "website_vikrant247.com" },
                  ]
                ]
              }
            }
          );
        } catch (error) {
          console.error(`Failed to message user ${user.telegram_id}:`, error);
        }
      }

      await ctx.reply(`✅ Website selection sent to ${validUsers.length} eligible users`);
    } catch (error) {
      console.error('Error in ask_username:', error);
      await ctx.reply("❌ Failed to process command. Please try again.");
    }
  });
  
  // Command: /reset_week - Resets week number to 1
  bot.command('reset_week', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN) {
      return ctx.reply("🚫 Only admin can reset the week");
    }

    try {
      await resetWeek();
      await ctx.reply("✅ Week number has been reset to 1");
    } catch (error) {
      console.error('Error resetting week:', error);
      await ctx.reply("❌ Failed to reset week number");
    }
  });
}

module.exports = setupAdminHandlers; 