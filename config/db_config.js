/**
 * Database configuration and connection setup
 */
const path = require('path');
const { Sequelize } = require('sequelize');
const { config, validateEnv } = require('./config');
const logger = require('../utils/logger');

// Load environment variables first
// Optional: load .env from custom path if in production
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({
    path: '/home/techspac/winfix.techsphareet.com/.env'
  });
} else {
  require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
  });
}

// Then validate environment variables after loading them
try {
  validateEnv();
} catch (error) {
  console.warn(`Environment validation warning: ${error.message}`);
  // Continue execution instead of crashing
}

/**
 * Creates a Sequelize instance with optimized configuration
 */
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 20,            // Maximum number of connection in pool
      min: 5,             // Minimum number of connection in pool
      acquire: 30000,     // Maximum time (ms) to acquire a connection
      idle: 10000         // Maximum time (ms) a connection can be idle before being released
    },
    retry: {
      max: 3,             // Maximum retries for failed queries
      match: [            // Retry only these errors
        /Deadlock/i,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    benchmark: process.env.NODE_ENV !== 'production',  // Log query execution time in non-production
    dialectOptions: {
      connectTimeout: 60000, // Longer connection timeout
      ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined
    },
    timezone: '+00:00'    // Set timezone for consistent datetime handling
  }
);

// Test the database connection only (no sync)
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (err) {
    logger.error('Unable to connect to the database:', err.message);
    // Retry mechanism will handle reconnection
  }
})();

module.exports = sequelize;