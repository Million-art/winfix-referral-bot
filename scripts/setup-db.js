#!/usr/bin/env node

/**
 * Database setup script
 * Run this script to initialize the database for the first time
 * or to reset the database in development mode
 * 
 * Usage: node scripts/setup-db.js
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { runMigrations } = require('../migrations/setup');
const logger = require('../utils/logger');

// Display environment info
logger.info('Running database setup script...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Database: ${process.env.DATABASE}`);
logger.info(`Host: ${process.env.HOST}`);
logger.info(`User: ${process.env.DB_USER || process.env.USER}`);

// Run database setup
runMigrations()
  .then(success => {
    if (success) {
      logger.info('✅ Database setup complete - all tables created');
      process.exit(0);
    } else {
      logger.error('❌ Database setup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error('Uncaught error during setup:', error);
    process.exit(1);
  }); 