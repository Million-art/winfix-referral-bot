/**
 * Handler for website selection
 */

function setupWebsiteHandler(bot) {
  // Website selection handler
  bot.action(/^website_(.+)$/, async (ctx) => {
    try {
      console.log('Website selection triggered:', ctx.match[1]);
      const website = ctx.match[1];
      const userId = ctx.from.id;
      
      // 1. Acknowledge callback
      await ctx.answerCbQuery(`Selected ${website}`);
      
      // 2. Try to delete original message
      try {
        await ctx.deleteMessage();
        console.log('Original message deleted');
      } catch (error) {
        console.log('Could not delete message (maybe too old)');
      }
      
      // 3. Store selection with more detailed logging
      const selection = {
        website: website,
        timestamp: Date.now(),
        userId: userId,
        userName: ctx.from.first_name
      };
      
      ctx.state.pendingSelections.set(userId, selection);
      console.log('Stored selection:', selection);
      
      // 4. Request username with force reply
      const reply = await ctx.reply(
        `🌐 You selected: ${website}\n\nPlease reply with your ${website} username:`,
        {
          reply_markup: {
            force_reply: true,
            selective: true,
            input_field_placeholder: `Your ${website} username`
          }
        }
      );
      
      // Store reply message ID for reference
      selection.replyMessageId = reply.message_id;
      ctx.state.pendingSelections.set(userId, selection);
      console.log('Updated selection with reply ID:', selection);
      
    } catch (error) {
      console.error('Website selection error:', error);
      await ctx.reply("❌ Failed to process selection. Please try again.");
    }
  });
}

module.exports = setupWebsiteHandler; 