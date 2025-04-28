# Technical Deployment Guide

## System Architecture

The Telegram Referral Bot is built with the following components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Telegram API   │◄────┤  Node.js App    │◄────┤  MySQL Database │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                             ▲
                             │
                        ┌────┴────┐
                        │         │
                        │  cPanel │
                        │         │
                        └─────────┘
```

### Components

1. **Node.js Application**
   - Express.js web server
   - Telegraf.js bot framework
   - Sequelize ORM for database interactions
   - Winston logger for logging

2. **MySQL Database**
   - Stores user data
   - Tracks referrals
   - Manages statistics

3. **Webhook Integration**
   - HTTP endpoint for Telegram updates
   - Processes incoming messages
   - Handles callbacks

## Deployment Steps

### 1. Server Preparation

#### Requirements
- cPanel hosting with Node.js support
- MySQL database
- Domain or subdomain
- SSL certificate (recommended but optional)

#### Server Setup
```bash
# Create necessary directories
mkdir -p /home/username/yourdomain.com/logs

# Navigate to project directory
cd /home/username/yourdomain.com

# Install dependencies
npm install
```

### 2. Database Setup

In cPanel:
1. Go to MySQL Databases
2. Create a new database (e.g., `username_botdb`)
3. Create a new user with a strong password
4. Add the user to the database with ALL PRIVILEGES

### 3. Environment Configuration

Create a `.env` file or set environment variables through cPanel:

```
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token
ADMIN_ID=your_telegram_id
BOT_URL=https://t.me/your_bot
CARD_IMAGE_URL=https://example.com/image.png

# Server Configuration
NODE_ENV=production
PORT=3000
DOMAIN=yourdomain.com

# Telegram Channel
CHANNEL_ID=your_channel_id
CHANNEL_URL=https://t.me/your_channel
MIN_REFERRAL_COUNT=5

# Database Configuration
DATABASE=username_botdb
DB_USER=database_username
PASSWORD=your_password
HOST=localhost

# Logging
LOG_LEVEL=info
```

### 4. Database Initialization

Run the database initialization script:

```bash
node initialize.js
```

### 5. Apache Configuration (.htaccess)

Create an `.htaccess` file in the root directory:

```apache
# Node.js Proxy Configuration
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>
```

### 6. Setup Node.js Application in cPanel

1. In cPanel, navigate to "Setup Node.js App"
2. Configure the application:
   - Node.js version: 18 (or latest LTS)
   - Application mode: Production
   - Application root: /home/username/yourdomain.com
   - Application URL: https://yourdomain.com (or http://yourdomain.com)
   - Application startup file: app.js
   - Environment variables: (as listed above)

3. Click "Create" or "Update"

### 7. Webhook Setup

Set up the webhook for Telegram to communicate with your bot:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=http://yourdomain.com/webhook
```

Verify the webhook status:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

### 8. PM2 Setup (Alternative to cPanel Node.js App)

If cPanel's Node.js App feature is not available, use PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start app.js --name telegram-bot

# Set PM2 to start on system boot
pm2 startup
pm2 save
```

## System Monitoring

### Log Files

The application generates the following logs:

- **Application Logs**: `/home/username/yourdomain.com/logs/app.log`
- **Error Logs**: `/home/username/yourdomain.com/logs/error.log`

### Health Check Endpoint

A health check endpoint is available at:

```
http://yourdomain.com/health
```

This returns JSON with the current application status.

### Telegram Webhook Info

To check the status of your webhook:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## Common Deployment Issues

### 503 Service Unavailable

**Cause**: Node.js application not running or not accessible
**Solutions**:
- Verify application is running in cPanel Node.js App
- Check that the port matches in .htaccess and application
- Ensure the application has proper permissions

### Database Connection Errors

**Cause**: Incorrect database credentials or permissions
**Solutions**:
- Verify database credentials in environment variables
- Check database user permissions
- Ensure MySQL server is running

### Webhook Certificate Errors

**Cause**: SSL certificate issues or DNS misconfiguration
**Solutions**:
- Use a proper SSL certificate for HTTPS
- If using HTTP, ensure the URL is correctly formatted
- Verify DNS records point to the correct server

## Security Considerations

1. **Environment Variables**: Never expose your `.env` file or environment variables
2. **Bot Token**: Keep your Telegram Bot Token secure
3. **Database**: Use a strong password for your database
4. **Rate Limiting**: The application includes rate limiting for API endpoints
5. **Input Validation**: All user input is validated and sanitized

## Backup Procedures

### Database Backup

```bash
# Via cPanel:
# Use the phpMyAdmin or Backup Wizard tools

# Via command line:
mysqldump -u username -p database_name > backup.sql
```

### Application Backup

```bash
# Back up the entire application directory
tar -czvf bot_backup.tar.gz /home/username/yourdomain.com
```

## Upgrade Procedures

1. **Backup**: Create backups of both code and database
2. **Stop Application**: Stop the Node.js application in cPanel
3. **Update Code**: Replace files with the new version
4. **Apply Migrations**: Run any necessary database migrations
5. **Restart Application**: Start the Node.js application

---

*This technical documentation was generated on April 25, 2025* 