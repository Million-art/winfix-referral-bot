/**
 * Configuration module for the application
 * Validates and manages environment variables
 */

const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Validate required environment variables
 * Throws error if any required variables are missing in production
 */
function validateEnv() {
  const required = {
    production: [
      'BOT_TOKEN', 
      'ADMIN_ID', 
      'DATABASE', 
      'PASSWORD', 
      'HOST',
      'DOMAIN',
      'CHANNEL_ID',
      'CHANNEL_URL',
      'MIN_REFERRAL_COUNT',
      'PORT',
      'LOG_LEVEL'
    ],
    development: [
      'BOT_TOKEN',
      'ADMIN_ID'
    ]
  };

  // Default to development if NODE_ENV is not set
  const env = process.env.NODE_ENV || 'development';
  
  // Safe check - if the environment is not in our required object, default to development
  const envVarsToCheck = required[env] || required['development'];
  
  const missingVars = envVarsToCheck.filter(name => !process.env[name]);

  if (missingVars.length > 0) {
    if (env === 'production') {
      throw new Error(`Missing required environment variables in production mode: ${missingVars.join(', ')}`);
    } else {
      console.warn(`Warning: Missing recommended environment variables: ${missingVars.join(', ')}. Using defaults for development.`);
    }
  }
  
  // Print database connection details for debugging
  console.log('Database connection details:');
  console.log('- Database name:', process.env.DATABASE);
  console.log('- Database user:', process.env.DB_USER || process.env.USER);
  console.log('- Database host:', process.env.HOST);
  console.log('- Using password:', process.env.PASSWORD ? 'YES' : 'NO');
  console.log('- SSL:', process.env.DB_SSL === 'true' ? 'ENABLED' : 'DISABLED');
}

// Sequelize configuration
const sequelizeConfig = {
    development: {
        username: process.env.DB_USER || process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        host: process.env.HOST,
        dialect: 'mysql',
        logging: console.log
    },
    test: {
        username: process.env.DB_USER || process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        host: process.env.HOST,
        dialect: 'mysql',
        logging: false
    },
    production: {
        username: process.env.DB_USER || process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        host: process.env.HOST,
        dialect: 'mysql',
        logging: false
    }
};

/**
 * Configuration object with defaults and environment variables
 */
const config = {
    bot: {
        token: process.env.BOT_TOKEN,
        adminId: process.env.ADMIN_ID,
        url: process.env.BOT_URL,
        cardImageUrl: process.env.CARD_IMAGE_URL
    },
    db: {
        name: process.env.DATABASE,
        user: process.env.DB_USER || process.env.USER,
        password: process.env.PASSWORD,
        host: process.env.HOST,
        dialect: 'mysql',
        ssl: process.env.DB_SSL === 'true'
    },
    telegram: {
        channelId: process.env.CHANNEL_ID,
        channelUrl: process.env.CHANNEL_URL,
        minReferralCount: parseInt(process.env.MIN_REFERRAL_COUNT, 10) || 0
    },
    server: {
        port: parseInt(process.env.PORT, 10) || 3000,
        env: process.env.NODE_ENV || 'development',
        domain: process.env.DOMAIN
    },
    security: {
        inputValidation: true,
        sanitizeUserInput: true
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    }
};

module.exports = { config, validateEnv, ...sequelizeConfig };