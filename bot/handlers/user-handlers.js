/**
 * User command handlers for the bot
 * Includes my_referral, rules, leaderboard
 */
const { countMyWeeklyReferrals, getCurrentLeaderboard } = require('../../services/user.js');
const { MIN_REFERRAL_COUNT } = require('../../constants.js');
const { processUserWebsiteSubmission } = require('../../services/userService');
const { Referral } = require('../../models');
const sequelize = require('../../config/db_config.js');
const { ADMIN } = require('../../constants.js');

/**
 * Sets up all user command handlers
 * @param {Object} bot - Telegraf bot instance
 */
function setupUserHandlers(bot) {
  // Command: /my_referral - Shows user's referral stats
  bot.command('my_referral', async (ctx) => {
    try {
      // Call the stats function
      await countMyWeeklyReferrals(ctx);
    } catch (err) {
      console.error("Error sending referral stats:", err);
      await ctx.reply("❌ Something went wrong.");
    }
  });
  
  // Command: /rules - Shows rules and regulations
  bot.command('rules', async (ctx) => {
    const rulesMessage = `
📜 *Rules and Regulations for Referral System*

1. *Referral Process*
   - Share your unique referral link with friends
   - Friends must join the channel through your link
   - Friends must remain in the channel to count as valid referrals

2. *Valid Referrals*
   - Only users who are active members of the channel count
   - If a referred user leaves the channel, they no longer count
   - You cannot refer yourself
   - Each user can only be referred once

3. *Qualification Requirements*
   - Minimum ${MIN_REFERRAL_COUNT} valid referrals required to qualify
   - All referrals must be active channel members
   - Referrals are validated when you submit your username

4. *Reward Process*
   - Once you qualify, you'll be asked to select your website
   - Provide your correct username for the selected website
   - Rewards are processed after validation
`;

    await ctx.reply(rulesMessage, { parse_mode: 'Markdown' });
  });
  
  // Command: /leaderboard - Shows current monthly leaders
  bot.command('leaderboard', async (ctx) => {
    try {
      // Show typing indicator
      await ctx.sendChatAction('typing');
      
      // Get top 3 leaders
      const leaders = await getCurrentLeaderboard(ctx);
      
      if (leaders.length === 0) {
        return ctx.reply("No active referrals yet. Be the first to refer someone!");
      }

      // Build simple leaderboard message
      let message = "🏆 Top 3 Referrers:\n\n";
      const medals = ["🥇", "🥈", "🥉"];
      
      leaders.slice(0, 3).forEach((leader, index) => {
        message += `${medals[index]} ${leader.first_name} - ${leader.referral_count} referrals\n`;
      });

      await ctx.reply(message);

    } catch (error) {
      console.error("Leaderboard error:", error);
      await ctx.reply("Failed to load leaderboard. Please try again later.");
    }
  });

  // This command should be admin-only, so we redirect users to admin
  bot.command('ask_username', async (ctx) => {
    if (ctx.from.id.toString() === ADMIN) {
      // If admin, pass to next handler
      return;
    }
    await ctx.reply("🚫 This command is for admin use only. If you have enough referrals, the admin will send you website selection options automatically.");
  });
  
  // Handle text messages for username submission
  setupUsernameSubmissionHandler(bot);
}

/**
 * Sets up the text message handler for username submissions
 * @param {Object} bot - Telegraf bot instance
 */
function setupUsernameSubmissionHandler(bot) {
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    
    // Skip command messages
    if (ctx.message.text.startsWith('/')) {
      return;
    }
    
    // Get selection from state
    const pendingSelection = ctx.state.pendingSelections?.get(userId);
    
    // Only process if this user has a pending selection
    if (pendingSelection && pendingSelection.website) {
      console.log('Username message received:', ctx.message.text);
      console.log('User info:', {
        id: userId,
        first_name: ctx.from.first_name,
        username: ctx.from.username
      });
      
      const username = ctx.message.text.trim();
      const website = pendingSelection.website;
      
      console.log('Username submitted:', username);
      console.log('Selected website:', website);

      try {
        // Process the submission
        const result = await processUserWebsiteSubmission(ctx, website, username);
        console.log('processUserWebsiteSubmission result:', result);
        
        // Clear the pending selection only if successful
        if (result) {
          console.log(`Clearing pending selection for user ${userId}`);
          ctx.state.pendingSelections.delete(userId);
        }
        
      } catch (error) {
        console.error("Error processing username submission:", error);
        await ctx.reply("❌ An error occurred while processing your submission. Please try again later.");
      }
    }
  });
}

module.exports = setupUserHandlers; 