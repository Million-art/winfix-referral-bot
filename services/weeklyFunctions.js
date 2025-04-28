const { sequelize } = require("../config/db_config");
const { ADMIN, CHANNEL_ID } = require("../constants");
const { WeeklyWinner, ThisWeekWinner, Referral } = require("../models");
const { getCurrentWeek } = require("./weekTracker");

/**
 * Archives current week winners to the weekly_winners table
 * @param {Transaction} transaction - Sequelize transaction object
 * @returns {Promise<number>} - Current week number
 */
async function archiveCurrentWeek(transaction) {
  try {
    console.log('Starting archiveCurrentWeek process...');
    const weekNumber = await getCurrentWeek();
    console.log(`Current week is: ${weekNumber}`);
    
    const winners = await ThisWeekWinner.findAll({ transaction });
    console.log(`Found ${winners.length} winners to archive`);

    // Archive all winners regardless of count
    if (winners.length > 0) {
      console.log('Creating bulk records in weekly_winners...');
      const recordsToCreate = winners.map(winner => ({
        week_number: weekNumber,
        telegram_id: winner.telegram_id,
        first_name: winner.first_name,
        website: winner.website,
        web_username: winner.web_username,
        referral_count: winner.referral_count
      }));
      
      const createdRecords = await WeeklyWinner.bulkCreate(recordsToCreate, { transaction });
      console.log(`Successfully archived ${createdRecords.length} winners for week ${weekNumber}`);
    } else {
      console.log('No winners to archive for this week');
    }

    return weekNumber;
  } catch (error) {
    console.error('Error in archiveCurrentWeek:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.original?.code,
      sqlMessage: error.original?.sqlMessage
    });
    throw error;
  }
}

async function addWinnerToThisWeekTable(ctx, validReferralCount, website, username) {
  const userId = ctx.from.id;
  const userFirstName = ctx.from.first_name;

  console.log('Starting addWinnerToThisWeekTable with:', {
    userId,
    userFirstName,
    validReferralCount,
    website,
    username
  });

  if (!website || !username) {
    await ctx.reply("Website and username are required.");
    return false;
  }

  try {
    const data = {
      telegram_id: userId,
      first_name: userFirstName,
      referral_count: validReferralCount,
      website: website,
      web_username: username,
      created_at: new Date()
    };

    console.log('Attempting to create/update with data:', data);

    // Use upsert to either insert or update
    const [winner, created] = await ThisWeekWinner.upsert(data, {
      returning: true,
      where: {
        telegram_id: userId
      }
    });

    console.log('Upsert result:', {
      created,
      winner: winner.toJSON()
    });

    const responseMessage = validReferralCount > 0
      ? `✅ Success! Your ${website} username "${username}" has been recorded with ${validReferralCount} valid referrals.`
      : "⚠️ You currently have no valid referrals this week.";

    await ctx.reply(responseMessage);

    return true;

  } catch (error) {
    console.error("Error in addWinnerToThisWeekTable:", error);
    console.error("Full error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      original: error.original
    });
    await ctx.reply("❌ There was an issue processing your submission. Please try again later.");
    await ctx.telegram.sendMessage(
      ADMIN, 
      `Error processing winner submission:\n` +
      `User: ${userFirstName} (${userId})\n` +
      `Error: ${error.message}`
    );
    return false;
  }
}

module.exports = {
  archiveCurrentWeek,
  addWinnerToThisWeekTable
};