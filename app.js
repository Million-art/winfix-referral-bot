// Load environment variables from .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const { Telegraf } = require('telegraf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { config, validateEnv } = require('./config/config');
const logger = require('./utils/logger');
const sequelize = require('./config/db_config');

// Validate environment variables before starting
try {
  validateEnv();
  logger.info('Environment variables validated successfully');
} catch (error) {
  logger.error('Environment validation failed:', error.message);
  process.exit(1);
}

// Create the bot instance
const bot = new Telegraf(config.bot.token);

// Load all bot handlers
require('./bot')(bot);

// Determine if we're in production mode
const isProduction = config.server.env === 'production';
logger.info(`Running in ${isProduction ? 'production' : 'development'} mode`);

// Create the Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/webhook', apiLimiter);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: isProduction ? 'Database connection failed' : error.message
    });
  }
});

// Webhook handler for Telegram (only used in production)
app.post('/webhook', (req, res) => {
  try {
    // Validate incoming update
    if (!req.body || !req.body.update_id) {
      logger.warn('Invalid update received:', req.body);
      return res.status(400).send('Invalid update');
    }
    
    // Pass update to bot
    bot.handleUpdate(req.body, res);
  } catch (error) {
    logger.error('Webhook error:', error);
  } finally {
    // Always respond OK to Telegram
    if (!res.headersSent) {
      res.status(200).send('OK');
    }
  }
});

// Simple status endpoint
app.get('/', (req, res) => {
  res.send('Bot is running');
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).send('Internal Server Error');
});

// Set up port for local testing
const PORT = config.server.port;

// Start the app differently based on environment
if (isProduction) {
  // PRODUCTION MODE: Use webhook
  
  // Start the Express server
  app.listen(PORT, () => {
    logger.info(`Express server is running on port ${PORT}`);
    
    // Always use HTTP protocol
    const webhookUrl = `http://${config.server.domain}/webhook`;
    
    // Set webhook for the bot
    bot.telegram.setWebhook(webhookUrl)
      .then(() => {
        logger.info(`Webhook set to ${webhookUrl}`);
      })
      .catch(err => {
        logger.error('Failed to set webhook:', err);
      });
  });
  
  // Check webhook status on startup
  setTimeout(async () => {
    try {
      const webhookInfo = await bot.telegram.getWebhookInfo();
      logger.info('Webhook info:', webhookInfo);
      
      if (!webhookInfo.url || webhookInfo.pending_update_count > 100) {
        logger.warn('Webhook issues detected:', {
          url: webhookInfo.url,
          pendingUpdates: webhookInfo.pending_update_count
        });
        
        // Notify admin
        await bot.telegram.sendMessage(config.bot.adminId, 
          `⚠️ Webhook issue detected!\n\n` +
          `URL: ${webhookInfo.url || 'Not set'}\n` +
          `Pending updates: ${webhookInfo.pending_update_count}\n\n` +
          `Set webhook using:\n` +
          `https://api.telegram.org/bot{TOKEN}/setWebhook?url=http://${config.server.domain}/webhook`
        );
      }
    } catch (error) {
      logger.error('Webhook check failed:', error);
    }
  }, 5000);
} else {
  // DEVELOPMENT MODE: Use long polling
  
  // Start Express server
  app.listen(PORT, async () => {
    logger.info(`Express server is running on port ${PORT}`);
    logger.info('Starting bot in development mode with long polling');
    
    try {
      // Remove any existing webhook
      const webhookInfo = await bot.telegram.getWebhookInfo();
      if (webhookInfo.url) {
        logger.info(`Removing existing webhook at ${webhookInfo.url}`);
        await bot.telegram.deleteWebhook();
        logger.info('Existing webhook removed successfully');
      }
      
      // Start bot with long polling
      await bot.launch();
      logger.info('✅ Bot successfully started with long polling');
      logger.info('💡 Bot is now listening for messages directly (no webhook needed)');
      
      // Log connection details
      logger.info('Database connection details:', {
        host: process.env.HOST,
        database: process.env.DATABASE,
        user: process.env.USER
      });
      
    } catch (error) {
      logger.error('Failed to start bot in development mode:', error);
      process.exit(1);
    }
  });
}

// Graceful shutdown
function shutdown() {
  logger.info('Received shutdown signal');
  
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
  
  // Stop the bot
  bot.stop('SIGTERM');
  
  // Close database connection
  sequelize.close().then(() => {
    logger.info('Database connection closed');
    process.exit(0);
  }).catch(err => {
    logger.error('Error closing database connection:', err);
    process.exit(1);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Export for hosting environments that require it
module.exports = app;