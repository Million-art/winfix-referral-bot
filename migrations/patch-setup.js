/**
 * Database Patch Script
 * 
 * This script updates the migrations process to work with existing database where
 * telegram_id is already the primary key.
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const logger = require('../utils/logger');

async function patchDatabase() {
  try {
    logger.info('Starting database patch process...');
    
    // Check if the users table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'users'",
      { type: QueryTypes.SELECT }
    );
    
    const usersTableExists = tables && Object.values(tables)[0] === 'users';
    
    if (usersTableExists) {
      logger.info('Users table already exists, checking structure...');
      
      // Check if telegram_id is already the primary key
      const [primaryKeys] = await sequelize.query(
        "SHOW KEYS FROM users WHERE Key_name = 'PRIMARY'",
        { type: QueryTypes.SELECT }
      );
      
      if (primaryKeys && primaryKeys.Column_name === 'telegram_id') {
        logger.info('telegram_id is already the primary key, skipping modification');
      } else {
        logger.warn('telegram_id is not the primary key, adjusting models accordingly');
      }
      
      // Since we're in patch mode, just make sure sequelize syncs without trying to add a new primary key
      // We've already modified the User model to use telegram_id as PK
      await sequelize.sync({ alter: true });
      
      logger.info('Database structure patched successfully');
    } else {
      // If users table doesn't exist, let sequelize create everything
      logger.info('Users table does not exist, creating with telegram_id as primary key');
      await sequelize.sync({ force: false });
      logger.info('Database tables created successfully');
    }
    
    return true;
  } catch (error) {
    logger.error('Patch process failed:', error.message);
    console.error(error);
    return false;
  }
}

// Run patch if this file is executed directly
if (require.main === module) {
  patchDatabase()
    .then(success => {
      if (success) {
        logger.info('✅ Database patch complete');
        process.exit(0);
      } else {
        logger.error('❌ Database patch failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Uncaught error during patch:', error);
      process.exit(1);
    });
}

module.exports = { patchDatabase }; 