# 📦 RENDER DATABASE DEPLOYMENT GUIDE

**Created:** October 27, 2025, 8:26 PM  
**Source:** Local Docker PostgreSQL  
**Destination:** Render Production PostgreSQL

---

## 📁 BACKUP FILES CREATED

### **1. SQL Format (Recommended for Render)**
- **File:** `render_production_backup_20251027_202612.sql`
- **Size:** 79.76 KB (81,670 bytes)
- **Format:** Plain SQL with DDL and data
- **Features:**
  - ✅ Human-readable
  - ✅ Works with `psql` command
  - ✅ Contains `DROP` and `CREATE` statements
  - ✅ Full schema + all data
  - ✅ Easy to review before deployment

### **2. Custom Format (Compressed)**
- **File:** `render_production_backup_compressed.dump`
- **Size:** 49.13 KB (50,306 bytes)
- **Format:** PostgreSQL custom format (compressed)
- **Features:**
  - ✅ Smaller file size
  - ✅ Faster to transfer
  - ✅ Requires `pg_restore` command
  - ✅ Can restore selectively

---

## 📊 DATABASE CONTENTS

### **Tables Included: 19**

| Table Name | Size | Records | Purpose |
|-----------|------|---------|---------|
| `view_events` | 152 KB | 2 | Ad view tracking (with 24hr reward system) |
| `users` | 112 KB | 3 | User accounts (admin, advertiser, viewer) |
| `ads` | 112 KB | 1 | Advertisements |
| `purchased_packages` | 56 KB | 1 | Package purchases by advertisers |
| `wallets` | 56 KB | 2 | User wallet balances |
| `sections` | 48 KB | 8 | Business categories |
| `transactions` | 40 KB | 0 | Financial transactions |
| `comments` | 32 KB | 0 | Ad comments |
| `notifications` | 32 KB | 0 | User notifications |
| `advertiser_packages` | 24 KB | 4 | Available packages (P10, P15, P20, P30) |
| `withdrawals` | 24 KB | 0 | Withdrawal requests |
| `admin_settings` | 24 KB | 0 | System configuration |
| `sessions` | 24 KB | 0 | User sessions |
| `company_wallets` | 24 KB | 1 | Company revenue tracking |
| `videos` | 16 KB | 0 | Legacy video table |
| `comment_likes` | 16 KB | 0 | Comment likes |
| `otp_codes` | 16 KB | 0 | OTP authentication |
| `ad_verification_history` | 16 KB | 0 | Ad approval audit trail |
| `ad_appeals` | 16 KB | 0 | Ad rejection appeals |

**Total Records:** 22  
**Total Database Size:** ~830 KB

---

## 🔧 DEPLOYMENT OPTIONS

### **Option 1: Upload via Render Dashboard (EASIEST)**

1. **Go to Render Dashboard:**
   - Navigate to your PostgreSQL database
   - Click "Shell" or "Connect"

2. **Upload the SQL file:**
   - Use Render's file upload feature
   - Or paste the SQL content directly

3. **Execute:**
   ```bash
   psql $DATABASE_URL < render_production_backup_20251027_202612.sql
   ```

---

### **Option 2: Deploy via Local psql Command (RECOMMENDED)**

**Using the SQL file:**
```bash
# Navigate to backups directory
cd C:\Users\andro\View\backend\backups

# Execute restore
psql postgresql://viewapp_postgres_user:Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf@dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com/viewapp_postgres -f render_production_backup_20251027_202612.sql
```

**Or pipe directly:**
```bash
cat render_production_backup_20251027_202612.sql | psql postgresql://viewapp_postgres_user:Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf@dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com/viewapp_postgres
```

---

### **Option 3: Deploy via Custom Format**

**Using pg_restore:**
```bash
pg_restore -h dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com \
  -U viewapp_postgres_user \
  -d viewapp_postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  render_production_backup_compressed.dump
```

---

### **Option 4: Deploy via PowerShell (Windows)**

```powershell
# Set password
$env:PGPASSWORD = 'Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf'

# Deploy SQL backup
Get-Content .\render_production_backup_20251027_202612.sql | `
  psql -h dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com `
       -p 5432 `
       -U viewapp_postgres_user `
       -d viewapp_postgres

# Clear password
Remove-Item Env:\PGPASSWORD
```

---

## ⚠️ PRE-DEPLOYMENT CHECKLIST

### **IMPORTANT: Backup Production First!**

Before deploying, **backup your current Render database**:

```bash
pg_dump -h dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com \
  -U viewapp_postgres_user \
  -d viewapp_postgres \
  > render_production_current_backup.sql
```

### **Verify Before Deployment:**

1. ✅ Backup current production database
2. ✅ Review SQL file contents (check for sensitive data)
3. ✅ Ensure Render database credentials are correct
4. ✅ Plan for downtime (if needed)
5. ✅ Have rollback plan ready

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Backup Current Production**
```bash
# Backup existing Render database
pg_dump $RENDER_DATABASE_URL > production_backup_before_deploy.sql
```

### **Step 2: Clear Production Database (Optional)**
```sql
-- Only if you want to start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO viewapp_postgres_user;
```

### **Step 3: Deploy New Schema and Data**
```bash
# Upload the backup file
psql $RENDER_DATABASE_URL < render_production_backup_20251027_202612.sql
```

### **Step 4: Verify Deployment**
```sql
-- Check tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return: 19

-- Check records
SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL SELECT 'sections', COUNT(*) FROM sections
UNION ALL SELECT 'packages', COUNT(*) FROM advertiser_packages
UNION ALL SELECT 'ads', COUNT(*) FROM ads;
```

### **Step 5: Test Application**
```bash
# Restart your backend service on Render
# Test critical endpoints:
curl https://viewapp-backend.onrender.com/api/sections
curl https://viewapp-backend.onrender.com/api/advertiser/packages
```

---

## 🔍 WHAT'S INCLUDED IN BACKUP

### **✅ Schema:**
- All 19 tables with correct structure
- All 54 indexes (including 24hr reward system)
- All foreign key constraints
- All ENUM types
- All unique constraints
- All default values

### **✅ Data:**
- **3 Users:**
  - 1 Admin (ID: 00000000-0000-0000-0000-000000000000)
  - 1 Test Advertiser (with wallet: 1000 KWD)
  - 1 Test Viewer (with wallet: 0 KWD)
- **8 Business Sections** (Retail, Food, Health, Education, etc.)
- **4 Advertiser Packages** (P10, P15, P20, P30)
- **1 Company Wallet** (initialized)
- **1 Test Ad** (approved)
- **2 View Events** (24hr system test data)

### **✅ Features:**
- 24-hour recurring reward system (fully configured)
- Micro-unit precision for financial calculations
- Complete foreign key relationships
- Optimized indexes for performance
- Production-ready schema

---

## 🔄 ROLLBACK PROCEDURE

If deployment fails or issues occur:

### **Step 1: Restore from Backup**
```bash
# Drop current schema
psql $RENDER_DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore backup
psql $RENDER_DATABASE_URL < production_backup_before_deploy.sql
```

### **Step 2: Verify Restoration**
```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check critical data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM ads;
```

---

## 📝 POST-DEPLOYMENT TASKS

### **1. Update Environment Variables**
Ensure your backend has correct database URL:
```env
DATABASE_URL=postgresql://viewapp_postgres_user:Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf@dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com/viewapp_postgres
```

### **2. Test Critical Flows**
- ✅ User registration
- ✅ User login
- ✅ Section listing
- ✅ Package purchase
- ✅ Ad creation
- ✅ Ad viewing and rewards
- ✅ Wallet operations

### **3. Monitor Performance**
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM view_events 
WHERE user_id = 'test-id' 
  AND completed_at >= NOW() - INTERVAL '24 hours';

-- Check index usage
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### **4. Clear Test Data (Optional)**
```sql
-- Remove test users and data
DELETE FROM view_events WHERE proof_token LIKE 'test_token%';
DELETE FROM wallets WHERE user_id IN (
  SELECT id FROM users WHERE phone LIKE '+9655%'
);
DELETE FROM users WHERE phone LIKE '+9655%';
```

---

## 🎯 VERIFICATION QUERIES

After deployment, run these to verify everything:

```sql
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Expected: 19 tables

-- 2. Check indexes
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
-- Expected: 54+ indexes

-- 3. Check foreign keys
SELECT COUNT(*) 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
-- Expected: 23+ foreign keys

-- 4. Check 24hr reward system
SELECT indexname FROM pg_indexes 
WHERE tablename = 'view_events' 
  AND indexname LIKE '%24hr%';
-- Expected: idx_view_events_24hr_reward_check

-- 5. Check data
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'sections', COUNT(*) FROM sections
UNION ALL SELECT 'advertiser_packages', COUNT(*) FROM advertiser_packages
UNION ALL SELECT 'purchased_packages', COUNT(*) FROM purchased_packages
UNION ALL SELECT 'ads', COUNT(*) FROM ads
UNION ALL SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL SELECT 'company_wallets', COUNT(*) FROM company_wallets;
```

**Expected Results:**
- users: 3
- sections: 8
- advertiser_packages: 4
- purchased_packages: 1
- ads: 1
- wallets: 2
- company_wallets: 1

---

## 🚨 TROUBLESHOOTING

### **Error: "relation already exists"**
**Solution:** Use `--clean --if-exists` flags:
```bash
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $DATABASE_URL < backup.sql
```

### **Error: "permission denied"**
**Solution:** Check database user permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE viewapp_postgres TO viewapp_postgres_user;
GRANT ALL ON SCHEMA public TO viewapp_postgres_user;
```

### **Error: "connection refused"**
**Solution:** Verify database URL and credentials:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### **Slow Performance**
**Solution:** Rebuild indexes and analyze:
```sql
REINDEX DATABASE viewapp_postgres;
ANALYZE;
```

---

## 📊 BACKUP FILE DETAILS

### **SQL Backup Contents:**
```
File: render_production_backup_20251027_202612.sql
Size: 79.76 KB
Lines: ~2,500
Format: UTF-8 SQL

Contains:
├── DROP statements (with IF EXISTS)
├── CREATE ENUM types (5)
├── CREATE TABLE statements (19)
├── CREATE INDEX statements (54)
├── ALTER TABLE (foreign keys)
├── INSERT statements (all data)
└── GRANT statements
```

### **Custom Backup Contents:**
```
File: render_production_backup_compressed.dump
Size: 49.13 KB (compressed)
Format: PostgreSQL custom format

Advantages:
✓ 38% smaller than SQL
✓ Faster restore
✓ Can restore specific tables
✓ Includes binary data
```

---

## ✅ SUCCESS CRITERIA

After deployment, verify:

- [ ] All 19 tables created
- [ ] All 54+ indexes active
- [ ] All foreign keys working
- [ ] 24hr reward system operational
- [ ] Test users can login
- [ ] Sections display correctly
- [ ] Packages available
- [ ] No errors in application logs
- [ ] Query performance < 100ms
- [ ] All API endpoints working

---

## 📞 SUPPORT

If issues occur during deployment:

1. **Check Render logs:**
   ```bash
   # In Render dashboard, view database logs
   ```

2. **Verify connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

3. **Rollback if needed:**
   ```bash
   psql $DATABASE_URL < production_backup_before_deploy.sql
   ```

---

## 🎉 DEPLOYMENT COMPLETE

Once deployed successfully:

✅ Your Render database will have:
- Complete production schema
- 24-hour recurring reward system
- All test data and configurations
- Optimized performance indexes
- Full data integrity

🚀 **Your application is ready for production!**

---

**Backup Created By:** AI Coding Agent  
**Date:** October 27, 2025, 8:26 PM  
**Source Database:** Local Docker PostgreSQL  
**Backup Files:** 2 (SQL + Custom format)  
**Total Size:** 129 KB  
**Tables:** 19  
**Records:** 22  
**Status:** ✅ Ready for Deployment

