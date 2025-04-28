/**
 * Handler for message processing
 */
const { processUserWebsiteSubmission } = require('../../services/userService');

function setupMessageHandler(bot) {
  // Username submission handler
  bot.on('message', async (ctx, next) => {
    try {
      console.log('--- New Message Received ---');
      console.log('From:', ctx.from.id, ctx.from.first_name);
      
      const userId = ctx.from.id;
      const pendingSelection = ctx.state.pendingSelections.get(userId);
      
      // Check if this is a reply to our username request
      if (pendingSelection && ctx.message.text && ctx.message.reply_to_message) {
        if (ctx.message.reply_to_message.message_id === pendingSelection.replyMessageId) {
          const username = ctx.message.text.trim();
          console.log('Username submitted:', username);
          
          // Actually process the submission and save to database
          const result = await processUserWebsiteSubmission(ctx, pendingSelection.website, username);
          
          // Only clear the pending selection if successful
          if (result) {
            ctx.state.pendingSelections.delete(userId);
          }
          
          return; // Stop processing this message
        }
      }
      
      // Pass to next handler if not a username submission
      await next();
      
    } catch (error) {
      console.error('Message processing error:', error);
      console.log('Message processing error:', error);
      await ctx.reply("❌ An error occurred processing your message. Please try again.");
    }
  });
}

module.exports = setupMessageHandler; 