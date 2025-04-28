const sequelize = require('../config/db_config');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { User, Referral } = require('../models');
const { joinChannelMarkup } = require('../helper/keyboard');
const { isRealUser } = require('../utils/userValidator');

/**
 * Generates a referral link for a user
 * @param {Object} ctx - Telegram context
 * @returns {string} - Referral link
 */
const getReferralLink = (ctx) => {
  return `${config.bot.url}?start=${ctx.from.id}`;
};

/**
 * Sends referral link to the user
 * @param {Object} ctx - Telegram context
 * @returns {Promise<void>}
 */
const sendReferralLink = async (ctx) => {
  try {
    logger.info(`Sending referral link to user ${ctx.from.id}`);
    
    const userReferralLink = getReferralLink(ctx);
    const imageCaption = `${require('../constants').REFERRAL_CAPTION}\n\n🔗 Your referral link:\n${userReferralLink}`;

    logger.debug("Sending photo with caption");
    
    // Validate the image URL before sending
    if (!config.bot.cardImageUrl || !config.bot.cardImageUrl.startsWith('http')) {
      throw new Error('Invalid card image URL configuration');
    }
    
    // Send with retry mechanism
    let attempt = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (attempt < maxAttempts) {
      try {
        await ctx.replyWithPhoto(config.bot.cardImageUrl, {
          reply_markup: {
            inline_keyboard: [
              [{
                text: "Check how many users you referred",
                callback_data: "referred_users_number"
              }]
            ]
          },
          caption: imageCaption,
          parse_mode: "HTML" 
        });
        
        logger.info(`Successfully sent referral link to user ${ctx.from.id}`);
        return;
      } catch (error) {
        attempt++;
        lastError = error;
        logger.warn(`Attempt ${attempt} failed to send referral link:`, error.message);
        
        if (attempt < maxAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    // If we got here, all attempts failed
    logger.error(`Failed to send referral link after ${maxAttempts} attempts:`, lastError);
    throw new Error('Failed to send referral link after multiple attempts');
  } catch (error) {
    logger.error('Error sending referral link:', error);
    throw new Error('Failed to send referral link');
  }
};

/**
 * Registers a user with a referral number
 * @param {Object} ctx - Telegram context
 * @param {string} referralNum - Referral number
 * @returns {Promise<void>}
 */
const regUserWithReferralNumber = async (ctx, referralNum) => {
  // Validate referral number again
  if (!Number.isInteger(Number(referralNum))) {
    throw new Error("Invalid referral number format");
  }
  
  if (Number(referralNum) === Number(ctx.from.id)) {
    throw new Error("You cannot refer yourself.");
  }

  // Check if user has already been referred - do this outside the transaction
  const existingReferral = await Referral.findOne({
    where: { referred_id: ctx.from.id }
  });

  if (existingReferral) {
    throw new Error("You have already been referred.");
  }

  const transaction = await sequelize.transaction();
  let transactionCommitted = false;
  
  try {
    logger.info(`Registering user ${ctx.from.id} with referral ${referralNum}`);
    
    // Get referrer's username and check if they've left
    const referrer = await User.findOne({
      where: { 
        telegram_id: referralNum,
        left: false  // Only allow referrals from active users
      },
      attributes: ['username', 'first_name'],
      transaction
    });

    if (!referrer) {
      throw new Error("Referrer not found or has left the bot");
    }

    // Check if user is real based on our criteria
    const isReal = await isRealUser(ctx);
    logger.info(`User ${ctx.from.id} real status check: ${isReal}`);

    // Create or update user
    const [user] = await User.findOrCreate({
      where: { telegram_id: ctx.from.id },
      defaults: {
        first_name: ctx.from.first_name || 'Unknown',
        username: ctx.from.username || null,
        left: false
      },
      transaction
    });

    // If user exists and had left, update their status
    if (user && user.left) {
      await user.update({
        left: false,
        first_name: ctx.from.first_name || 'Unknown',
        username: ctx.from.username || null
      }, { transaction });
    }

    // Create referral record with real user validation
    await Referral.create({
      telegram_id: referralNum,
      referred_id: ctx.from.id,
      referred_username: ctx.from.username || null,
      referral_status: 'new',
      is_real_referral: isReal  // Set based on validation result
    }, { transaction });

    await transaction.commit();
    transactionCommitted = true;
    logger.info(`User ${ctx.from.id} registered with referral ${referralNum} (Real User: ${isReal})`);

    // Send notification to admin about the new referral
    const ADMIN_ID = require('../constants').ADMIN;
    try {
      // Create a detailed user report
      const userReport = `
🔔 *New Referral Alert*

*User Status:* ${isReal ? '✅ REAL USER' : '⚠️ POTENTIAL FAKE'}
*Referred By:* ${referrer.first_name} (${referrerStatus(referrer.username)})

*User Details:*
• ID: \`${ctx.from.id}\`
• Name: ${ctx.from.first_name || 'N/A'} ${ctx.from.last_name || ''}
• Username: ${ctx.from.username ? '@' + ctx.from.username : 'None set ⚠️'}
• Language: ${ctx.from.language_code || 'Unknown'}
• Has profile pic: ${await hasProfilePic(ctx) ? 'Yes ✅' : 'No ⚠️'}

*Validation Criteria:*
• Has username: ${ctx.from.username ? 'Yes ✅' : 'No ⚠️'}
• Name length: ${getFullNameLength(ctx.from)} chars ${getFullNameLength(ctx.from) >= 3 ? '✅' : '⚠️'}
• Profile pic: ${await hasProfilePic(ctx) ? 'Yes ✅' : 'No ⚠️'}

${isReal ? '' : '⚠️ *INVALID REFERRAL*: This user will not be considered as a valid referral for rewards. '}
      `;

      await ctx.telegram.sendMessage(ADMIN_ID, userReport, { parse_mode: 'Markdown' });
    } catch (notifyError) {
      logger.error('Failed to notify admin about new referral:', notifyError);
    }

    return ctx.reply(
      'Join the channel to complete the process:',
      { ...joinChannelMarkup, parse_mode: "HTML" }
    );
  } catch (error) {
    // Only roll back if transaction hasn't been committed yet
    if (!transactionCommitted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    logger.error('Referral registration error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error("You have already been referred.");
    }
    throw new Error(error.message || "An error occurred. Please try again.");
  }
};

/**
 * Helper function to check if user has a profile picture
 * @param {Object} ctx - Telegram context
 * @returns {Promise<boolean>}
 */
async function hasProfilePic(ctx) {
  try {
    const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, 0, 1);
    return photos && photos.total_count > 0;
  } catch (error) {
    logger.error(`Error checking profile pic:`, error);
    return false;
  }
}

/**
 * Helper function to get referrer username status text
 * @param {string|null} username - Username or null
 * @returns {string} - Formatted username or ID note
 */
function referrerStatus(username) {
  return username ? '@' + username : 'No username';
}

/**
 * Helper function to get full name length
 * @param {Object} user - User object
 * @returns {number} - Length of combined first and last name
 */
function getFullNameLength(user) {
  return [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()
    .length;
}

/**
 * Validates user referrals
 * @param {number} userId - User ID
 * @returns {Promise<boolean>}
 */
const validateUserReferrals = async (userId) => {
  try {
    const count = await Referral.count({
      where: { telegram_id: userId }
    });
    
    return count >= config.telegram.minReferralCount;
  } catch (error) {
    logger.error('Error validating referrals:', error);
    return false;
  }
};

module.exports = {
  getReferralLink,
  sendReferralLink,
  regUserWithReferralNumber,
  validateUserReferrals
};