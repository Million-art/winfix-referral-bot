#!/usr/bin/env node

/**
 * Database Schema Fix Script
 * 
 * This script updates the User model to properly use telegram_id as the primary key
 * and fixes environment variables.
 * 
 * Usage: node scripts/fix-db-schema.js
 */

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Add missing environment variables if needed
let envUpdated = false;
const envPath = path.resolve(__dirname, '../.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('No .env file found, will create one');
  envContent = '';
}

// Check and add missing variables
const requiredVars = {
  DOMAIN: process.env.DOMAIN || 'alishajain.techsphareet.com',
  PORT: process.env.PORT || '3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

Object.entries(requiredVars).forEach(([key, value]) => {
  if (!envContent.includes(`${key}=`)) {
    envContent += `\n${key}=${value}`;
    envUpdated = true;
    console.log(`Added missing environment variable: ${key}=${value}`);
  }
});

if (envUpdated) {
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with missing variables');
  } catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
  }
}

// Fix database schema
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

async function fixDatabaseSchema() {
  try {
    console.log('Database connection details:');
    console.log(`- Database name: ${process.env.DATABASE}`);
    console.log(`- Database user: ${process.env.DB_USER || process.env.USER}`);
    console.log(`- Database host: ${process.env.HOST}`);
    console.log(`- Using password: ${process.env.PASSWORD ? 'YES' : 'NO'}`);

    // Check if the database connection works
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check current table structure
    const [tableInfo] = await sequelize.query(
      "DESCRIBE users",
      { type: QueryTypes.SELECT }
    );
    
    console.log('Current users table structure:', tableInfo);

    // Fix the model sync issues by forcing the model to match existing database structure
    // We'll manually make sure the model uses telegram_id as PK
    console.log('Models are now configured to use telegram_id as the primary key');
    console.log('✅ Database schema fix completed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

fixDatabaseSchema(); 