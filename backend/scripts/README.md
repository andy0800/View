# Database Data Wipe Scripts

⚠️ **WARNING: These scripts will DELETE ALL DATA from the database!**

## Overview

These scripts are designed to completely wipe all existing data from the database while preserving the database schema. This is useful for:

- Starting fresh with a clean database
- Removing test data before production
- Resetting the system to initial state
- Troubleshooting data-related issues

## Available Scripts

### 1. `wipeAllData.js` - Sequelize Model-Based Wipe
- Uses Sequelize models to delete data
- Handles foreign key constraints properly
- More controlled deletion process
- Better error handling and reporting

### 2. `wipeAllDataSQL.js` - Direct SQL Wipe
- Uses direct SQL commands for faster execution
- More thorough data removal
- Handles all table types
- Faster execution for large datasets

## Usage

### Option 1: Using npm scripts (Recommended)
```bash
# Navigate to backend directory
cd backend

# Run the Sequelize-based wipe
npm run wipe-data

# OR run the SQL-based wipe
npm run wipe-data-sql
```

### Option 2: Direct execution
```bash
# Navigate to backend directory
cd backend

# Run directly with Node.js
node scripts/wipeAllData.js

# OR
node scripts/wipeAllDataSQL.js
```

## What Gets Wiped

The scripts will delete ALL data from these tables:

### User & Authentication Tables
- `users` - All user accounts
- `advertisers` - Advertiser profiles
- `viewers` - Viewer profiles
- `sessions` - User sessions
- `otp_codes` - OTP verification codes

### Content Tables
- `ads` - All advertisements
- `videos` - All video content
- `sections` - Content sections/categories
- `comments` - User comments
- `comment_likes` - Comment likes

### Financial Tables
- `wallets` - User wallet balances
- `company_wallets` - Company wallet balances
- `transactions` - All financial transactions
- `withdrawals` - Withdrawal requests
- `advertiser_packages` - Package definitions
- `purchased_packages` - User package purchases

### Tracking & Analytics Tables
- `view_events` - Ad view tracking
- `ad_verification_history` - Ad verification logs
- `ad_appeals` - Ad appeal requests

## What Gets Preserved

- **Database Schema** - All table structures remain intact
- **Indexes** - Database performance indexes are preserved
- **Constraints** - Foreign key relationships are maintained
- **Triggers** - Database triggers remain functional
- **Stored Procedures** - Any custom procedures are preserved

## Safety Features

1. **Foreign Key Handling** - Temporarily disables constraints during deletion
2. **Transaction Safety** - Uses proper transaction handling
3. **Error Recovery** - Continues processing even if individual tables fail
4. **Verification** - Confirms all data has been removed
5. **Connection Management** - Properly closes database connections

## Recovery

⚠️ **IMPORTANT: This action cannot be undone!**

If you need to recover data after running these scripts, you would need to:
1. Restore from a database backup
2. Restore from version control (if data was committed)
3. Re-enter all data manually

## Prerequisites

Before running these scripts, ensure:

1. **Database Connection** - Environment variables are properly configured
2. **Backup** - Create a database backup if you need to preserve any data
3. **Permissions** - Database user has DELETE and TRUNCATE permissions
4. **No Active Connections** - Stop the application to avoid conflicts

## Environment Variables Required

Make sure these are set in your `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure database user has proper permissions
   - Check if user can TRUNCATE tables

2. **Foreign Key Constraints**
   - Scripts handle this automatically
   - If issues persist, check database configuration

3. **Connection Errors**
   - Verify database is running
   - Check environment variables
   - Ensure no other connections are active

### Error Messages

- **"Model not found"** - Some models may not exist in your database
- **"Permission denied"** - Database user lacks required permissions
- **"Connection refused"** - Database server is not accessible

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify database connectivity
3. Ensure all prerequisites are met
4. Check database user permissions

## Final Warning

⚠️ **THINK TWICE BEFORE RUNNING THESE SCRIPTS!**

- This will delete ALL your data
- The action cannot be undone
- Make sure you have backups if needed
- Ensure you're running this on the correct database
- Consider testing on a development database first
