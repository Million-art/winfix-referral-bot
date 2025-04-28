/**
 * Utility functions for validating Telegram users
 */
const logger = require('./logger');

/**
 * Checks if a user is considered "real" based on specific criteria:
 * 1. Must be an active Telegram user (not deleted/deactivated)
 * AND at least one of:
 * 2. Has a username
 * 3. Has a profile picture
 * 4. Has a name with at least 3 characters
 * 
 * @param {Object} ctx - Telegram context object
 * @returns {Promise<boolean>} - True if user meets criteria, false otherwise
 */
async function isRealUser(ctx) {
  try {
    const user = ctx.from;
    logger.info(`Validating user ${user.id}:`, {
      has_username: !!user.username,
      first_name: user.first_name,
      last_name: user.last_name
    });
    
    // First check if user is active (not deleted)
    if (!user || user.is_deleted) {
      logger.info(`User ${user.id} is deleted or inactive`);
      return false;
    }

    // Check if user has username
    if (user.username) {
      logger.info(`User ${user.id} has username: ${user.username}`);
      return true;
    }

    // Check if user has a profile picture
    try {
      const photos = await ctx.telegram.getUserProfilePhotos(user.id, 0, 1);
      if (photos && photos.total_count > 0) {
        logger.info(`User ${user.id} has profile picture`);
        return true;
      }
      logger.info(`User ${user.id} has no profile picture`);
    } catch (error) {
      logger.error(`Error checking profile photo for user ${user.id}:`, error.message);
    }

    // Check if user has a proper name (at least 3 characters)
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    if (fullName.length >= 3) {
      logger.info(`User ${user.id} has valid name length: ${fullName.length} chars`);
      return true;
    }
    
    logger.info(`User ${user.id} name too short: ${fullName.length} chars`);

    // If none of the criteria are met
    logger.info(`User ${user.id} failed all validation criteria`);
    return false;
  } catch (error) {
    logger.error('Error validating user:', error);
    return false;
  }
}

module.exports = {
  isRealUser
}; 