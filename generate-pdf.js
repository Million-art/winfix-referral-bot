#!/usr/bin/env node

/**
 * Documentation PDF Generator
 * 
 * This script converts markdown documentation to PDF format.
 * 
 * Requirements:
 * npm install markdown-pdf
 * 
 * Usage:
 * node generate-pdf.js
 */

const markdownpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

// Ensure docs directory exists
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  console.error('Error: docs directory not found.');
  process.exit(1);
}

// Define PDF options
const pdfOptions = {
  cssPath: path.join(__dirname, 'docs/pdf-style.css'),
  paperBorder: '1cm',
  paperFormat: 'A4',
  remarkable: {
    html: true,
    breaks: true,
    typographer: true,
  }
};

// Create CSS file if it doesn't exist
const cssPath = path.join(__dirname, 'docs/pdf-style.css');
if (!fs.existsSync(cssPath)) {
  fs.writeFileSync(cssPath, `
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
    }
    
    h1, h2, h3, h4 {
      color: #2c3e50;
      margin-top: 1.5em;
    }
    
    h1 { 
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5em;
      page-break-before: always;
    }
    
    h1:first-of-type {
      page-break-before: avoid;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    
    th, td {
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    
    th {
      background-color: #f2f2f2;
    }
    
    code {
      background-color: #f8f8f8;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    pre {
      background-color: #f8f8f8;
      padding: 1em;
      border-radius: 3px;
      overflow-x: auto;
    }
    
    a {
      color: #3498db;
      text-decoration: none;
    }
    
    blockquote {
      border-left: 4px solid #ccc;
      padding-left: 1em;
      color: #666;
    }
    
    img {
      max-width: 100%;
    }
    
    .page-break {
      page-break-after: always;
    }
  `);
}

// Create a title page markdown
const titlePagePath = path.join(__dirname, 'docs/title-page.md');
fs.writeFileSync(titlePagePath, `
# Telegram Referral Bot

## Complete Documentation

**Version 1.0**

*Generated on ${new Date().toLocaleDateString()}*

---

This document contains:
1. User Guide
2. Technical Deployment Guide

---

<div class="page-break"></div>
`);

// Combine markdown files
const combinedMarkdownPath = path.join(__dirname, 'docs/combined-documentation.md');
const titlePage = fs.readFileSync(titlePagePath, 'utf8');
const userDoc = fs.readFileSync(path.join(__dirname, 'docs/bot-documentation.md'), 'utf8');
const techDoc = fs.readFileSync(path.join(__dirname, 'docs/technical-deployment.md'), 'utf8');

fs.writeFileSync(combinedMarkdownPath, `${titlePage}\n\n${userDoc}\n\n<div class="page-break"></div>\n\n${techDoc}`);

// Convert to PDF
console.log('Generating PDF documentation...');
markdownpdf(pdfOptions)
  .from(combinedMarkdownPath)
  .to(path.join(__dirname, 'docs/telegram-bot-documentation.pdf'), function () {
    console.log('✅ PDF documentation generated successfully!');
    console.log(`📄 File saved to: ${path.join(__dirname, 'docs/telegram-bot-documentation.pdf')}`);
  });

console.log('Processing documentation...'); 