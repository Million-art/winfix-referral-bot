/**
 * Global error handling middleware for the Telegram bot
 */

const ADMIN_LOG_ID = process.env.ADMIN_ID || "386095768";

async function logError(bot, error, context = '') {
  try {
    const errorMessage = `🚨 ERROR ${context ? `[${context}]` : ''}\n` +
      `⏰ ${new Date().toISOString()}\n` +
      `🔍 ${error.message}\n` +
      `📂 ${error.stack || 'No stack trace'}`;
    
    // Send to admin log channel
    await bot.telegram.sendMessage(ADMIN_LOG_ID, errorMessage.slice(0, 4096));
    
    // Also log to console
    console.error(errorMessage);
  } catch (logError) {
    console.error('Failed to send error log:', logError);
    console.error('Original error:', error);
  }
}

function setupErrorHandling(bot) {
  // Global error handler for bot context errors
  bot.catch(async (err, ctx) => {
    await logError(bot, err, `Unhandled error in update ${ctx.update.update_id}`);
    await ctx.reply('❌ An unexpected error occurred. The admin has been notified.');
  });
  
  // Global process error handlers
  process.on('unhandledRejection', (error) => {
    logError(bot, error, 'Unhandled Rejection');
  });
  
  process.on('uncaughtException', (error) => {
    logError(bot, error, 'Uncaught Exception');
    process.exit(1);
  });
}

module.exports = {
  setupErrorHandling,
  logError
}; 