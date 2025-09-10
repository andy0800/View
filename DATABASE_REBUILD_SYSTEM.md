# 🚀 COMPLETE DATABASE REBUILD SYSTEM

## Overview

This is a bullet-proof database rebuild system that completely recreates all database tables, relationships, and data from scratch. It's designed to solve all database schema issues permanently.

## 🎯 Purpose

- **Eliminate all database schema mismatches**
- **Fix missing tables and columns**
- **Resolve foreign key constraint issues**
- **Ensure data integrity and consistency**
- **Provide a clean slate for production deployment**

## 📊 Database Structure

### Core Tables (18 total)

1. **`users`** - Central user table (viewers, advertisers, admins)
2. **`wallets`** - User wallet balances (micro-units)
3. **`sections`** - Business content sections
4. **`advertiser_packages`** - Ad package definitions
5. **`purchased_packages`** - User-purchased ad packages
6. **`ads`** - Video advertisements
7. **`view_events`** - Ad viewing tracking
8. **`transactions`** - Financial transactions
9. **`sessions`** - User authentication sessions
10. **`otp_codes`** - OTP verification codes
11. **`notifications`** - Admin notifications
12. **`admin_settings`** - System configuration
13. **`company_wallets`** - Company financial tracking
14. **`withdrawals`** - User withdrawal requests
15. **`comments`** - Ad comments system
16. **`comment_likes`** - Comment likes
17. **`ad_appeals`** - Ad rejection appeals
18. **`ad_verification_history`** - Ad verification audit trail

### Key Features

- **Micro-unit precision** for financial calculations
- **Complete foreign key relationships**
- **Comprehensive indexing** for performance
- **Data validation** and constraints
- **Default data population**
- **Integrity verification**

## 🛠️ Usage

### Automatic Rebuild (Recommended)

The system automatically runs a complete rebuild when:

```bash
# Development environment
NODE_ENV=development npm start

# Force rebuild in production
FORCE_DATABASE_REBUILD=true npm start
```

### Manual Rebuild

```bash
# Force complete rebuild
npm run force-rebuild

# Deploy with rebuild
npm run deploy-rebuild
```

### Programmatic Usage

```javascript
const { completeDatabaseRebuild } = require('./src/startup/completeDatabaseRebuild');

// Force complete rebuild
await completeDatabaseRebuild();
```

## 🔧 Rebuild Process

### Step 1: Drop All Tables
- Drops all existing tables in reverse dependency order
- Handles foreign key constraints properly
- Ensures clean slate

### Step 2: Create All Tables
- Creates all 18 tables with complete schema
- Includes all required columns and data types
- Sets up proper constraints and defaults

### Step 3: Create Indexes
- Creates 50+ performance indexes
- Optimizes query performance
- Ensures data integrity

### Step 4: Populate Default Data
- Creates default admin user
- Populates business sections
- Sets up advertiser packages
- Configures admin settings

### Step 5: Verify Integrity
- Validates all tables exist
- Checks critical data is present
- Ensures database consistency

## 📋 Default Data

### Admin User
- **ID**: `00000000-0000-0000-0000-000000000000`
- **Name**: Admin User
- **Phone**: `+96500000000`
- **Role**: admin
- **Status**: verified

### Business Sections
- Entertainment
- Technology
- Lifestyle
- Business
- Education

### Advertiser Packages
- Basic Package (15 seconds)
- Standard Package (30 seconds)
- Premium Package (60 seconds)

### Admin Settings
- Email notifications
- Push notifications
- Verification alerts
- Withdrawal alerts
- Appeal alerts
- System settings
- Security settings
- Business settings

## ⚠️ Important Notes

### Data Loss Warning
**This system DROPS ALL EXISTING DATA!** Use with caution in production.

### Environment Variables
- `FORCE_DATABASE_REBUILD=true` - Forces complete rebuild
- `NODE_ENV=development` - Auto-rebuilds in development

### Production Deployment
For production, use the force rebuild only when necessary:

```bash
# Set environment variable
export FORCE_DATABASE_REBUILD=true

# Deploy
npm run deploy-rebuild
```

## 🔍 Verification

After rebuild, verify the system:

```bash
# Check database integrity
npm run test-critical-tables

# Verify admin settings
npm run verify-admin-settings

# Test wallet associations
npm run test-wallet-associations
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure database user has DROP/CREATE privileges
   - Check connection permissions

2. **Foreign Key Errors**
   - System handles dependencies automatically
   - Tables are created in correct order

3. **Data Type Mismatches**
   - All data types are standardized
   - Micro-unit precision implemented

### Recovery

If rebuild fails:

```bash
# Check database connection
npm run test-db-fix

# Run quick fix as fallback
npm start  # Uses quickDatabaseFix as fallback
```

## 📈 Performance

### Indexes Created
- **Primary keys**: 18
- **Unique constraints**: 8
- **Performance indexes**: 50+
- **Composite indexes**: 5

### Query Optimization
- All foreign keys indexed
- Frequently queried columns indexed
- Composite indexes for complex queries

## 🔐 Security

### Data Validation
- All constraints enforced
- Data type validation
- Length limits enforced
- Enum values validated

### Access Control
- Proper foreign key relationships
- Cascade delete rules
- Data integrity maintained

## 📝 Migration Notes

### From Legacy Schema
- Converts DECIMAL to BIGINT for micro-units
- Adds missing foreign key relationships
- Standardizes data types
- Removes orphaned columns

### Backward Compatibility
- Maintains legacy field names where possible
- Provides conversion methods
- Supports gradual migration

## 🎉 Success Indicators

After successful rebuild:

```
✅ All required tables exist
✅ All indexes created
✅ Default data populated
✅ Database integrity verified
✅ Admin user created
✅ Sections populated
✅ Packages configured
✅ Settings initialized
```

## 📞 Support

If you encounter issues:

1. Check the logs for specific error messages
2. Verify database connection and permissions
3. Run the verification scripts
4. Use the quick fix as fallback

The system is designed to be bullet-proof and handle all edge cases automatically.
