# 🤖 Telegram Referral Bot

A powerful Telegram bot for managing referral programs with weekly and monthly rewards. Track referrals, manage winners, and automate reward distribution.

## ✨ Features

- 👥 **User Referral System**
  - Unique referral links for each user
  - Automatic referral tracking
  - Real-time referral status updates

- 🏆 **Reward Management**
  - Weekly winner selection
  - Monthly winner archival
  - Automated leaderboard updates
  - PDF report generation

- 📊 **Statistics & Tracking**
  - Individual referral counts
  - Weekly performance metrics
  - Monthly achievement records
  - Leaderboard rankings

- 🔐 **Admin Controls**
  - End week command
  - End month command
  - Winner management
  - System configuration

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL Database
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### Installation

1. Clone the repository
```bash
git clone https://github.com/Million-art/vikrant_referral_bot.git
cd vikrant_referral_bot
```

2. Install dependencies
```bash
npm install
```

3. Create a .env file in the root directory and add your configuration:
```env
# Bot Configuration
BOT_TOKEN=your_bot_token_here
BOT_URL=your_bot_url_here

# Channel Configuration
CHANNEL_ID=your_channel_id_here
CHANNEL_URL=your_channel_url_here

# Admin Configuration
ADMIN_ID=your_admin_telegram_id

# Database Configuration
HOST=localhost
USER=root
PASSWORD=your_password
DATABASE=your_database_name
DB_SSL=false

# Referral Configuration
MIN_REFERRAL_COUNT=0
CARD_IMAGE_URL=your_card_image_url

# Server Configuration
PORT=3000
NODE_ENV=development
DOMAIN=localhost
```

4. Set up the database
```bash
# Create the database
mysql -u root -p
CREATE DATABASE your_database_name;

# Run database migrations
npm run migrate
```

5. Start the bot
```bash
npm start
```

## 📦 Database Migration

This project uses Sequelize migrations for database setup and management. The necessary commands are:

```bash
# Run all pending migrations
npm run migrate

# Undo the most recent migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all

# Reset the database (drop, create, migrate)
npm run db:reset
```

## 📝 Available Commands

### User Commands
- `/start` - Start the bot and get your referral link
- `/my_referral` - Check your referral statistics
- `/rules` - View referral program rules
- `/leaderboard` - View current top performers

### Admin Commands
- `/end_week` - End current week and process winners
- `/end_month` - End current month and archive winners
- `/ask_username` - Request usernames from eligible winners
- `/reset_week` - Reset the week counter

## 🏗️ Project Structure

```
├── app.js              # Express server setup
├── bot.js              # Main bot loader file
├── bot/                # Refactored bot code
│   ├── handlers/       # Command handlers
│   ├── middlewares/    # Bot middleware
│   └── setup.js        # Bot initialization
├── config/             # Configuration
│   ├── config.js       # Environment validation
│   └── db_config.js    # Database connection
├── constants.js        # Global constants
├── migrations/         # Database migrations
├── helper/             # Helper functions
├── models/             # Database models
├── services/           # Business logic
└── utils/              # Utility functions
```

## 🛡️ Security

The application implements several security best practices:
- Helmet for HTTP security headers
- Rate limiting for API endpoints
- Sanitized user input
- Secure database configuration
- Validation of environment variables

## 📚 Logging

The application uses Winston for structured logging:
- Error logging to separate files
- Combined logs for all events
- Console output in development
- Configurable log levels via environment variables

## 🔄 Deployment

For production deployment:

1. Set NODE_ENV to 'production'
2. Configure your server to use HTTPS
3. Set up a webhook for your bot
4. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start app.js --name referral-bot
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/Million-art/vikrant_referral_bot.git/issues).

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

MILLION MULUGETA
- Telegram: [@miilla021](https://t.me/miilla021)
- GitHub: [@million-art](https://github.com/million-art)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped this project grow
- Special thanks to the Telegram Bot API team

---
⭐️ If you found this project helpful, please give it a star! 
