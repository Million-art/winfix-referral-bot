const { sequelize } = require('../models');
const logger = require('../utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Force sync in development, alter in production
    const options = {
      alter: process.env.NODE_ENV === 'production',
      force: process.env.NODE_ENV !== 'production'
    };
    
    // Sync all models with the database
    await sequelize.sync(options);
    
    logger.info('Database migrations completed successfully');
    return true;
  } catch (error) {
    logger.error('Migration failed:', error.message);
    console.error(error);
    return false;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(success => {
      if (success) {
        logger.info('✅ Database setup complete');
        process.exit(0);
      } else {
        logger.error('❌ Database setup failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Uncaught error during migration:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 