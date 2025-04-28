const { Referral, User, ThisWeekWinner } = require('../models');
const { CHANNEL_ID } = require('../constants');
// Debug logging has been removed for production

/**
 * Validates and processes user's website username submission
 * @param {Object} ctx - Telegram context
 * @param {string} website - The website name
 * @param {string} username - The user's username for the website
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
async function processUserWebsiteSubmission(ctx, website, username) {
    const userId = ctx.from.id;
    const userFirstName = ctx.from.first_name;
    const userUsername = ctx.from.username || null;

    try {
        console.log('Starting processUserWebsiteSubmission with:', {
            userId,
            userFirstName,
            website,
            username
        });

        // Validate website and username
        if (!website || !username) {
            await ctx.reply("❌ Both website and username are required.");
            return false;
        }

        // Make sure the user exists in our database
        try {
            const [user, userCreated] = await User.findOrCreate({
                where: { telegram_id: userId },
                defaults: {
                    telegram_id: userId,
                    first_name: userFirstName,
                    username: userUsername,
                    left: false
                }
            });
        } catch (error) {
            console.error('Error ensuring user exists:', error);
            throw error;
        }

        // Count valid referrals
        let validReferrals = 0;
        try {
            validReferrals = await Referral.count({
                where: {
                    telegram_id: userId,
                    referral_status: 'new',
                    is_real_referral: true
                }
            });
            console.log('Valid referrals count:', validReferrals);
        } catch (error) {
            console.error('Error counting valid referrals:', error);
            throw error;
        }

        if (validReferrals === 0) {
            await ctx.reply("⚠️ You don't have any valid referrals yet. Please invite more users to participate!");
            return false;
        }

        // Check if referred users are still in the channel
        let referrals = [];
        try {
            referrals = await Referral.findAll({
                where: {
                    telegram_id: userId,
                    referral_status: 'new',
                    is_real_referral: true
                }
            });
            console.log('Found referrals:', referrals.length);
        } catch (error) {
            console.error('Error finding referrals:', error);
            throw error;
        }

        let validReferralCount = 0;

        for (const referral of referrals) {
            try {
                const chatMember = await ctx.telegram.getChatMember(CHANNEL_ID, referral.referred_id);
                console.log('Chat member status for', referral.referred_id, ':', chatMember.status);
                
                if (['member', 'administrator', 'creator'].includes(chatMember.status)) {
                    validReferralCount++;
                } else {
                    // Update referral status if user left the channel
                    await referral.update({ is_real_referral: false });
                    console.log('Updated referral status to false for:', referral.referred_id);
                }
            } catch (error) {
                console.error(`Error checking member status for ${referral.referred_id}:`, error);
                // If we can't check the status, we'll assume they're not in the channel
                await referral.update({ is_real_referral: false });
            }
        }

        console.log('Valid referral count after channel check:', validReferralCount);

        if (validReferralCount === 0) {
            await ctx.reply("⚠️ None of your referred users are currently active in the channel. Please ensure they remain in the channel to be counted as valid referrals.");
            return false;
        }

        // Create or update the entry in ThisWeekWinner
        try {
            const data = {
                telegram_id: userId,
                first_name: userFirstName,
                referral_count: validReferralCount,
                website: website,
                web_username: username,
                created_at: new Date()
            };

            // Upsert operation
            const [winner, created] = await ThisWeekWinner.upsert(data, {
                returning: true
            });
            
            console.log('ThisWeekWinner upsert result:', {
                created,
                winner: winner ? winner.toJSON() : null
            });

            // Verify the data was saved
            const verification = await ThisWeekWinner.findOne({
                where: { telegram_id: userId }
            });
            
            console.log('Verification result:', 
                verification ? verification.toJSON() : 'Not found in database! Something went wrong.'
            );

            const responseMessage = validReferralCount > 0
                ? `✅ Success! Your ${website} username "${username}" has been recorded with ${validReferralCount} valid referrals.`
                : "⚠️ You currently have no valid referrals this week.";

            await ctx.reply(responseMessage);

            return true;
        } catch (error) {
            console.error('Error creating or updating ThisWeekWinner record:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in processUserWebsiteSubmission:', error);
        console.error('Detailed error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            original: error.original
        });
        await ctx.reply("❌ An error occurred while processing your submission. Please try again later.");
        return false;
    }
}

module.exports = {
    processUserWebsiteSubmission
}; 