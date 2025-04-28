#!/usr/bin/env node

/**
 * Bot and Database Initialization Script
 * 
 * This script performs initial setup tasks:
 * 1. Validates environment variables
 * 2. Tests database connection
 * 3. Creates necessary database tables
 * 4. Sets up webhook for production mode
 * 
 * Usage: node initialize.js
 */

// Load environment variables
require('dotenv').config();

const path = require('path');
const { Telegraf } = require('telegraf');
const { runMigrations } = require('./migrations/setup');
const { config, validateEnv } = require('./config/config');
const logger = require('./utils/logger');

// Show starting message
console.log('='.repeat(50));
console.log('TELEGRAM BOT INITIALIZATION SCRIPT');
console.log('='.repeat(50));

// Create the bot instance
const bot = new Telegraf(config.bot.token);

// Main initialization function
async function initialize() {
  try {
    // Step 1: Validate environment variables
    console.log('\n📋 VALIDATING ENVIRONMENT VARIABLES...');
    validateEnv();
    console.log('✅ Environment variables are valid');
    console.log(`  • Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  • Bot: ${config.bot.url}`);

    // Step 2: Run database migrations
    console.log('\n🗄️ SETTING UP DATABASE...');
    console.log(`  • Database: ${config.db.name}`);
    console.log(`  • Host: ${config.db.host}`);
    console.log(`  • User: ${config.db.user}`);
    
    const migrationSuccess = await runMigrations();
    if (!migrationSuccess) {
      throw new Error('Database migration failed');
    }
    console.log('✅ Database setup complete');

    // Step 3: Set up webhook for production mode
    if (process.env.NODE_ENV === 'production') {
      console.log('\n🔗 SETTING UP WEBHOOK...');
      const webhookUrl = `http://${config.server.domain}/webhook`;
      console.log(`  • URL: ${webhookUrl}`);
      
      // Delete any existing webhook
      await bot.telegram.deleteWebhook();
      console.log('  • Removed existing webhook');
      
      // Set the new webhook
      await bot.telegram.setWebhook(webhookUrl);
      console.log('✅ Webhook configured successfully');
      
      // Get webhook info
      const webhookInfo = await bot.telegram.getWebhookInfo();
      console.log('  • Webhook status:', webhookInfo.url ? 'ACTIVE' : 'NOT SET');
      console.log('  • Pending updates:', webhookInfo.pending_update_count);
    } else {
      console.log('\n🔄 LONG POLLING MODE');
      console.log('  • Webhook setup skipped in development mode');
      console.log('  • Bot will use long polling when started');
    }

    console.log('\n✅ INITIALIZATION COMPLETE');
    console.log('='.repeat(50));
    console.log('You can now start the bot with: node app.js');
    console.log('='.repeat(50));
    return true;
  } catch (error) {
    console.error('\n❌ INITIALIZATION FAILED');
    console.error(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Run the initialization
initialize()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error during initialization:', error);
    process.exit(1);
  }); 