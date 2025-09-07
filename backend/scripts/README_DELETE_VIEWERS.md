# Delete All Viewers Script

## Overview
This script (`deleteAllViewers.js`) safely removes all viewer user accounts from the database while preserving advertisers, admins, and all system functionality.

## ⚠️ IMPORTANT WARNING
**This action is IRREVERSIBLE and will permanently delete:**
- All viewer user accounts
- All viewer wallets and balances
- All viewer transaction history
- All viewer viewing activity
- All viewer comments and likes
- All viewer sessions

## What Gets Preserved
✅ **Advertiser accounts** - All business accounts remain intact
✅ **Admin accounts** - System administrators are preserved
✅ **Ad content** - All advertisements remain active
✅ **System functionality** - Core business logic continues working
✅ **Database structure** - All tables and relationships remain intact

## Prerequisites
1. **Database backup** - Always backup your database before running this script
2. **Environment setup** - Ensure your `.env` file has correct database credentials
3. **Node.js** - Script requires Node.js to run
4. **Dependencies** - All required packages must be installed

## Usage

### 1. Navigate to the scripts directory
```bash
cd backend/scripts
```

### 2. Run the script
```bash
node deleteAllViewers.js
```

### 3. Follow the safety prompts
The script will ask for two confirmations:
- First: "Are you absolutely sure you want to proceed? (yes/no)"
- Second: Type "DELETE_ALL_VIEWERS" exactly

## Safety Features

### 🔒 Double Confirmation
- Requires explicit "yes" response
- Requires typing "DELETE_ALL_VIEWERS" exactly
- Prevents accidental execution

### 🔄 Database Transaction
- All deletions happen within a single transaction
- Automatic rollback on any error
- Ensures data consistency

### 📊 Pre/Post Analysis
- Shows current user distribution before deletion
- Shows updated user distribution after deletion
- Provides detailed logging of all operations

## What Gets Deleted (In Order)

1. **Sessions** - User login sessions
2. **Comment Likes** - User reactions to comments
3. **Comments** - User comments on ads
4. **View Events** - User viewing activity and rewards
5. **Transactions** - User financial transaction history
6. **Withdrawals** - User withdrawal requests
7. **Wallets** - User account balances
8. **Users** - Viewer user records

## Database Impact

### Tables Affected
- `users` - Viewer records removed
- `wallets` - Viewer wallet records removed
- `transactions` - Viewer transaction records removed
- `view_events` - Viewer activity records removed
- `withdrawals` - Viewer withdrawal records removed
- `comments` - Viewer comment records removed
- `comment_likes` - Viewer like records removed
- `sessions` - Viewer session records removed

### Foreign Key Constraints
All deletions respect database foreign key constraints and CASCADE rules.

## Recovery Options

### If You Need to Restore Viewers
1. **Database Restore** - Restore from your backup
2. **Re-registration** - Viewers can create new accounts
3. **Data Import** - Import viewer data from external sources

### System Continuity
- Advertisers can continue creating and managing ads
- Admin functions remain fully operational
- New viewers can register normally
- All business logic continues working

## Monitoring After Deletion

### Check System Health
1. Verify admin dashboard loads correctly
2. Confirm advertiser functions work
3. Test new viewer registration
4. Monitor error logs for any issues

### Expected Behavior
- Viewer-related API endpoints will return empty results
- Admin dashboard will show 0 viewer accounts
- System will be ready for new viewer registrations

## Troubleshooting

### Common Issues
- **Permission denied** - Check database user permissions
- **Connection failed** - Verify database credentials in `.env`
- **Model not found** - Ensure all models are properly loaded

### Error Recovery
- Script automatically rolls back on errors
- Check console output for specific error details
- Verify database connectivity and permissions

## Best Practices

1. **Always backup first** - Never run without a recent backup
2. **Test in development** - Test the script in a safe environment first
3. **Monitor system** - Watch for any unexpected behavior after deletion
4. **Document changes** - Keep records of when this operation was performed
5. **Communicate** - Inform stakeholders about the planned maintenance

## Support
If you encounter issues or need assistance:
1. Check the console output for error details
2. Verify your database connection and permissions
3. Ensure all required models are available
4. Check that your `.env` file has correct database credentials

---
**Remember: This is a destructive operation. Use with extreme caution and always have a backup.**
