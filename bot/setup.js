/**
 * Bot setup and initialization
 */
const { setupErrorHandling } = require('./middlewares/error-handler');
const { setupStateManager } = require('./middlewares/state-manager');
const setupStartHandler = require('./handlers/start-handler');
const setupCallbackHandler = require('./handlers/callback-handler');
const setupWebsiteHandler = require('./handlers/website-handler');
const setupMessageHandler = require('./handlers/message-handler');
const setupAdminHandlers = require('./handlers/admin-handlers');
const setupUserHandlers = require('./handlers/user-handlers');
const { getCurrentWeek, incrementWeek, resetWeek } = require('../services/weekTracker');
const { archiveCurrentWeek } = require('../services/weeklyFunctions');
const { ADMIN } = require('../constants');
const { Referral, ThisWeekWinner, WeeklyWinner, MonthlyWinner } = require('../models');
const sequelize = require('../config/db_config');
const PDFDocument = require('pdfkit');
// Import models and associations (setup happens automatically)
require('../models/index');
const { logError } = require('./middlewares/error-handler');
const { setupSession } = require('./middlewares/session-store');

/**
 * Initializes the bot with all middleware and handlers
 * @param {Object} bot - Telegraf bot instance
 * @returns {Promise<boolean>} - True if initialization successful
 */
async function initializeBot(bot) {
  try {
    // Setup database
    await sequelize.authenticate();
    // Associations are now set up automatically when importing models/index.js

    // Setup error handling
    setupErrorHandling(bot);
    
    // Setup session storage - must come before state manager
    setupSession(bot);
    
    // Setup state management
    setupStateManager(bot);
    
    // Add basic command logging middleware (production-friendly)
    bot.use((ctx, next) => {
      if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
        console.log('Command received:', ctx.message.text);
      }
      return next();
    });
    
    // IMPORTANT: Register all command handlers directly before any other handlers
    // This ensures commands are handled correctly
    
    // Register the /current_week command directly
    bot.command('current_week', async (ctx) => {
      try {
        const weekNumber = await getCurrentWeek();
        await ctx.reply(`📅 Current Week: ${weekNumber}`);
      } catch (error) {
        console.error('Error getting current week:', error);
        await ctx.reply("❌ Failed to get current week number");
      }
    });
    
    // Register the /end_week command directly
    bot.command('end_week', async (ctx) => {
      if (ctx.from.id.toString() !== ADMIN) {
        return ctx.reply("🚫 Only admin can end the week");
      }

      // Send processing message
      const processingMsg = await ctx.reply("⏳ Processing week closure... Please wait");
      
      const transaction = await sequelize.transaction();
      
      try {
        // Step 1: Get current winners and archive them
        const winners = await ThisWeekWinner.findAll({ transaction });
        
        if (winners.length === 0) {
          await transaction.rollback();
          await ctx.telegram.editMessageText(
            processingMsg.chat.id,
            processingMsg.message_id,
            null,
            "ℹ️ No winners found this week - nothing to archive"
          );
          return;
        }
        
        const weekNumber = await getCurrentWeek();
        
        // Archive the winners
        await archiveCurrentWeek(transaction);

        // Step 2: Generate PDF file
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const doc = new PDFDocument();
        const chunks = [];

        // Collect PDF data
        doc.on('data', chunk => chunks.push(chunk));
        
        // Add header
        doc.fontSize(20)
           .text(`Week ${weekNumber} Winners Report`, { align: 'center' })
           .moveDown();
        
        doc.fontSize(12)
           .text(`Generated on: ${dateStr}`, { align: 'center' })
           .moveDown()
           .moveDown();

        // Add table header
        const startX = 50;
        let currentY = doc.y;
        
        // Draw table header
        doc.fontSize(12)
           .text('Rank', startX, currentY)
           .text('Name', startX + 50, currentY)
           .text('Website', startX + 200, currentY)
           .text('Username', startX + 350, currentY)
           .text('Referrals', startX + 450, currentY)
           .moveDown();

        // Draw header line
        doc.moveTo(startX, doc.y)
           .lineTo(startX + 500, doc.y)
           .stroke();
        
        doc.moveDown();

        // Add winners data
        winners.forEach((winner, index) => {
          const rank = index + 1;
          currentY = doc.y;
          
          // Handle empty or undefined first name
          const firstName = winner.first_name ? winner.first_name.trim() : '';
          
          doc.fontSize(11)
             .text(rank.toString(), startX, currentY)
             .text(firstName, startX + 50, currentY)
             .text(winner.website || '', startX + 200, currentY)
             .text(winner.web_username || '', startX + 350, currentY)
             .text(winner.referral_count.toString(), startX + 450, currentY)
             .moveDown();
        });

        // Draw bottom line
        doc.moveTo(startX, doc.y)
           .lineTo(startX + 500, doc.y)
           .stroke();

        // Add summary
        doc.moveDown()
           .fontSize(12)
           .text(`Total Winners: ${winners.length}`, { align: 'right' });

        // Finalize PDF
        doc.end();

        // Step 3: Update referral statuses
        const referralUpdateResult = await Referral.update(
          { referral_status: 'counted' },
          {
            where: { referral_status: 'new' },
            transaction
          }
        );

        // Step 4: Clear this week's data
        await ThisWeekWinner.destroy({
          truncate: true,
          transaction
        });

        // Step 5: Increment the week number
        const nextWeek = await incrementWeek();

        // Commit everything
        await transaction.commit();

        // Send success message
        await ctx.telegram.deleteMessage(processingMsg.chat.id, processingMsg.message_id);
        
        // Convert chunks to Buffer
        const pdfBuffer = Buffer.concat(chunks);
        const WEEK_END_CAPTION = "🏆 Week {weekNumber} Results 🏆\n\n";
        
        // Send the PDF file
        await ctx.replyWithDocument({
          source: pdfBuffer,
          filename: `week_${weekNumber}_winners_${dateStr}.pdf`
        }, {
          caption: WEEK_END_CAPTION.replace('{weekNumber}', weekNumber) +
                   `📊 ${winners.length} winners archived\n\n` +
                   `📅 Starting Week ${nextWeek}\n\n` +
                   `📋 Winners Summary:\n` +
                   winners.map((w, i) => 
                     `${["🥇","🥈","🥉"][i] || "🏅"} ${w.first_name} - ${w.referral_count} referrals (${w.website})`
                   ).join("\n")
        });

      } catch (error) {
        await transaction.rollback();
        
        // Log error information
        console.error("Error in end_week:", error);
        
        // Update processing message with error
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          "❌ Failed to process week: " + error.message
        );
      }
    });
    
    // Register the /end_month command directly
    bot.command('end_month', async (ctx) => {
      if (ctx.from.id.toString() !== ADMIN) {
        return ctx.reply("🚫 Only admin can end the month");
      }

      // Send initial processing message
      const processingMsg = await ctx.reply("⏳ Starting monthly closure process...\n\nPlease wait, this may take a moment...");
      const transaction = await sequelize.transaction();

      try {
        // Update message to show data collection
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          "⏳ Collecting monthly winner data...\n\nPlease wait..."
        );

        // Get all weekly winners for the month
        const weeklyWinners = await WeeklyWinner.findAll({
          attributes: [
            'telegram_id',
            'first_name',
            'website',
            'web_username',
            [sequelize.fn('SUM', sequelize.col('referral_count')), 'total_referrals']
          ],
          group: ['telegram_id', 'first_name', 'website', 'web_username'],
          order: [[sequelize.literal('total_referrals'), 'DESC']],
          transaction
        });
        
        if (weeklyWinners.length === 0) {
          await transaction.rollback();
          await ctx.telegram.editMessageText(
            processingMsg.chat.id,
            processingMsg.message_id,
            null,
            "ℹ️ No eligible winners this month\n\nNo data to archive."
          );
          return;
        }

        // Update message to show archiving status
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          "⏳ Archiving monthly winners...\n\nAlmost done..."
        );

        const now = new Date();
        const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        const weekNumber = await getCurrentWeek();
        
        // Generate PDF report
        const doc = new PDFDocument();
        const chunks = [];

        // Collect PDF data
        doc.on('data', chunk => chunks.push(chunk));
        
        // Add header
        doc.fontSize(20)
          .text(`Monthly Winners Report - ${monthYear}`, { align: 'center' })
          .moveDown();
        
        doc.fontSize(12)
          .text(`Generated on: ${now.toISOString().split('T')[0]}`, { align: 'center' })
          .moveDown()
          .moveDown();

        // Add table header
        const startX = 50;
        let currentY = doc.y;
        
        // Draw table header
        doc.fontSize(12)
          .text('Rank', startX, currentY)
          .text('Name', startX + 50, currentY)
          .text('Website', startX + 200, currentY)
          .text('Username', startX + 350, currentY)
          .text('Total Referrals', startX + 450, currentY)
          .moveDown();

        // Draw header line
        doc.moveTo(startX, doc.y)
          .lineTo(startX + 500, doc.y)
          .stroke();
        
        doc.moveDown();

        // Add winners data
        weeklyWinners.forEach((winner, index) => {
          const rank = index + 1;
          currentY = doc.y;
          
          // Handle empty or undefined first name
          const firstName = winner.first_name ? winner.first_name.trim() : '';
          
          doc.fontSize(11)
            .text(rank.toString(), startX, currentY)
            .text(firstName, startX + 50, currentY)
            .text(winner.website || '', startX + 200, currentY)
            .text(winner.web_username || '', startX + 350, currentY)
            .text(winner.get('total_referrals').toString(), startX + 450, currentY)
            .moveDown();
        });

        // Draw bottom line
        doc.moveTo(startX, doc.y)
          .lineTo(startX + 500, doc.y)
          .stroke();

        // Add summary
        doc.moveDown()
          .fontSize(12)
          .text(`Total Winners: ${weeklyWinners.length}`, { align: 'right' });

        // Finalize PDF
        doc.end();

        // Step 1: First truncate the monthly winners table
        await MonthlyWinner.destroy({
          truncate: true,
          transaction
        });

        // Step 2: Archive to MonthlyWinner
        await MonthlyWinner.bulkCreate(
          weeklyWinners.map(winner => ({
            month_year: monthYear,
            telegram_id: winner.telegram_id,
            first_name: winner.first_name,
            website: winner.website,
            web_username: winner.web_username,
            referral_count: winner.get('total_referrals')
          })),
          { transaction }
        );

        // Step 3: Clear weekly winners table
        await WeeklyWinner.destroy({
          truncate: true,
          transaction
        });

        // Step 4: Clear this week winners table
        await ThisWeekWinner.destroy({
          truncate: true,
          transaction
        });

        // Step 5: Update all referral statuses to 'end'
        const referralUpdateResult = await Referral.update(
          { referral_status: 'end' },
          {
            where: {
              referral_status: ['new', 'counted']
            },
            transaction
          }
        );

        // Step 6: Reset week number to 1
        await resetWeek();

        // Commit transaction
        await transaction.commit();

        // Delete processing message
        await ctx.telegram.deleteMessage(processingMsg.chat.id, processingMsg.message_id);
        
        // Convert chunks to Buffer
        const pdfBuffer = Buffer.concat(chunks);
        
        // Send the PDF report
        await ctx.replyWithDocument({
          source: pdfBuffer,
          filename: `monthly_winners_${monthYear.replace(' ', '_')}.pdf`
        }, {
          caption: `✅ Monthly archive for ${monthYear} complete!\n\n` +
                  `📊 ${weeklyWinners.length} winners archived\n\n` +
                  `📋 Top Winners:\n` +
                  weeklyWinners.slice(0, 3).map((w, i) => 
                    `${["🥇","🥈","🥉"][i]} ${w.first_name} - ${w.get('total_referrals')} total referrals`
                  ).join("\n")
        });

      } catch (error) {
        await transaction.rollback();
        console.error('Error in end_month:', error);
        
        // Update error message
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          "❌ Failed to process month end: " + error.message
        );
      }
    });
    
    // Now register other handlers
    setupStartHandler(bot);
    setupAdminHandlers(bot);
    setupUserHandlers(bot);
    setupCallbackHandler(bot);
    setupWebsiteHandler(bot);
    
    // Register message handler last
    setupMessageHandler(bot);
    
    console.log('✅ Bot configured and database connected');
    console.log('ℹ️ Bot is ready to handle updates via webhook');

    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return true;
  } catch (error) {
    console.error('🚨 Bot initialization failed:');
    console.error(error);
    await logError(bot, error, 'Bot initialization');
    return false;
  }
}

module.exports = initializeBot; 