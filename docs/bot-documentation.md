# Telegram Referral Bot Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [Commands](#commands)
5. [Admin Commands](#admin-commands)
6. [Workflow](#workflow)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

## Introduction

This Telegram bot is designed to help manage a referral program for a Telegram channel. It allows users to:
- Generate personalized referral links
- Track referrals
- Monitor statistics
- Win rewards based on referral performance

The bot supports both regular user commands and special admin commands to manage the entire referral system.

## Installation & Setup

### Requirements
- Node.js (v16 or higher)
- MySQL database
- cPanel hosting account

### Installation Steps

1. **Upload Files to Server**
   - Upload all project files to your hosting account
   - Place files in a directory like `/home/username/yourdomain.com/`

2. **Database Setup**
   - Create a MySQL database in cPanel
   - Note the database name, username, and password

3. **Environment Configuration**
   - Create a `.env` file or set environment variables in cPanel
   - Required variables:
     ```
     BOT_TOKEN=your_telegram_bot_token
     ADMIN_ID=your_telegram_id
     DATABASE=database_name
     DB_USER=database_user
     PASSWORD=database_password
     HOST=localhost
     DOMAIN=yourdomain.com
     CHANNEL_ID=your_telegram_channel_id
     CHANNEL_URL=https://t.me/your_channel
     NODE_ENV=production
     PORT=3000
     MIN_REFERRAL_COUNT=5
     ```

4. **Initialize the Bot**
   - Connect to your server via SSH
   - Navigate to your bot directory
   - Run: `node initialize.js`

5. **Set up as Persistent Service**
   - In cPanel, go to "Setup Node.js App"
   - Application root: `/home/username/yourdomain.com/`
   - Application URL: `https://yourdomain.com`
   - Application startup file: `app.js`
   - Application environment: NODE_ENV=production

6. **Set up Webhook**
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=http://yourdomain.com/webhook`

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| BOT_TOKEN | Telegram Bot API token | Yes | None |
| ADMIN_ID | Telegram ID of the admin | Yes | None |
| DATABASE | MySQL database name | Yes | None |
| DB_USER | Database username | Yes | None |
| PASSWORD | Database password | Yes | None |
| HOST | Database host | Yes | localhost |
| DOMAIN | Your bot's domain | Yes | None |
| CHANNEL_ID | Telegram channel ID | Yes | None |
| CHANNEL_URL | Telegram channel URL | Yes | None |
| NODE_ENV | Environment (production/development) | Yes | development |
| PORT | Application port | No | 3000 |
| MIN_REFERRAL_COUNT | Minimum referrals required | No | 5 |

### Database Schema

The bot automatically creates all necessary tables in the database. The main tables are:
- `Users`: Stores user information
- `Referrals`: Tracks referral relationships
- `WeeklyWinners`: Records weekly winners
- `MonthlyWinners`: Records monthly winners

## Commands

### User Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Start interacting with the bot | `/start` |
| `/help` | Show help message | `/help` |
| `/referral` | Get your referral link | `/referral` |
| `/mystats` | Check your referral statistics | `/mystats` |
| `/balance` | Check your current points/balance | `/balance` |

### Admin Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/admin` | Show admin menu | `/admin` |
| `/broadcast` | Send a message to all users | `/broadcast Hello everyone!` |
| `/stats` | View overall bot statistics | `/stats` |
| `/add_points` | Add points to a user | `/add_points @username 100` |
| `/set_min_referrals` | Set minimum referral count | `/set_min_referrals 10` |
| `/list_users` | List all registered users | `/list_users` |
| `/reset_weekly` | Reset weekly statistics | `/reset_weekly` |
| `/check_user` | Check if a user is real or fake | `/check_user @username` |
| `/ask_username` | Ask the user to submit username | `/ask_username` |

## Workflow

### User Registration Process

1. User starts the bot with `/start`
2. Bot checks if user is subscribed to the channel
3. If subscribed, bot generates a unique referral link
4. User can share this link with friends
5. When someone joins using their link, the referral is tracked

### Referral Validation

1. New user clicks on a referral link and starts the bot
2. Bot checks if the user is real (not a bot)
3. Bot verifies channel subscription
4. If valid, referral is counted towards the referrer
5. Admin receives a notification about the new referral

### Weekly/Monthly Rewards

1. System tracks all referrals during the period
2. At the end of week/month, winners are selected
3. Winners receive rewards based on their performance
4. Results are announced in the channel

## Maintenance

### Regular Maintenance Tasks

1. **Database Backup**
   - Regularly backup your database through cPanel

2. **Log Monitoring**
   - Check logs regularly in the `logs` directory
   - Important log files:
     - `app.log`: Application logs
     - `error.log`: Error logs

3. **Bot Updates**
   - Check for updates in the bot code
   - Update dependencies with `npm update`

4. **Webhook Verification**
   - Periodically verify webhook is working:
     - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo`

### Restarting the Bot

If you need to restart the bot:

1. In cPanel, go to "Setup Node.js App"
2. Find your application and click "Restart"

## Troubleshooting

### Common Issues

1. **503 Service Unavailable**
   - Cause: The Node.js application is not running
   - Solution: Restart the Node.js app in cPanel

2. **Database Connection Error**
   - Cause: Incorrect database credentials or database server down
   - Solution: Verify credentials in environment variables

3. **Webhook Error**
   - Cause: Incorrect webhook URL or server configuration
   - Solution: Reset webhook with correct URL

4. **Bot Not Responding**
   - Cause: Bot process might have crashed
   - Solution: Check error logs and restart the application

### Debugging

For advanced debugging:

1. SSH into your server
2. Navigate to your bot directory
3. Run the bot with verbose logging:
   ```bash
   NODE_ENV=production node app.js
   ```
4. Check for any error messages

---

## Support

For additional support or feature requests, please contact the developer.

---

*This documentation was generated on April 25, 2025* 