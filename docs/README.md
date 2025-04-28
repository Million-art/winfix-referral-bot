# Telegram Bot Documentation

This folder contains documentation for the Telegram Referral Bot.

## Contents

1. **bot-documentation.md** - User guide with commands and workflows
2. **technical-deployment.md** - Technical deployment guide for system administrators
3. **pdf-style.css** - CSS styles for PDF generation
4. **telegram-bot-documentation.pdf** - Combined PDF documentation (generated)

## Generating PDF Documentation

To generate the PDF documentation, follow these steps:

1. Install the required dependency:
   ```bash
   npm install markdown-pdf
   ```

2. Run the generation script:
   ```bash
   node generate-pdf.js
   ```

3. The PDF will be saved to `docs/telegram-bot-documentation.pdf`

## Documentation Structure

### User Guide

The user guide covers:
- Bot commands for regular users
- Admin commands and their usage
- Workflow explanation
- Basic troubleshooting

### Technical Deployment Guide

The technical guide covers:
- System architecture
- Deployment steps
- Environment configuration
- Database setup
- Monitoring and maintenance

## Customizing Documentation

To update the documentation:

1. Edit the markdown files (`bot-documentation.md` or `technical-deployment.md`)
2. Run the PDF generator to update the PDF version
3. Commit all changes to the repository

## PDF Styling

To customize the PDF appearance:

1. Edit the `pdf-style.css` file
2. Regenerate the PDF to see your changes 